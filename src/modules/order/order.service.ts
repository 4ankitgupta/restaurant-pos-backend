// src/modules/order/order.service.ts

import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import {
  OrderStatus,
  OrderItemStatus,
  type Order,
  type OrderItem,
} from "@prisma/client";
import { broadcastToRestaurant } from "../../websocketServer.js";

// Define the item type for validation, as this file also has addItemsToOrder
type OrderItemInput = {
  menuItemVariantId: string;
  quantity: number;
  note?: string;
};

// Helper function to recalculate order total excluding cancelled items
const recalculateOrderTotal = (orderItems: OrderItem[]): number => {
  return orderItems
    .filter((item) => item.status !== OrderItemStatus.CANCELLED)
    .reduce((sum, item) => {
      return sum + Number(item.price) * item.quantity;
    }, 0);
};

// Helper function to correct order total if it includes cancelled items
const correctOrderTotal = (order: any): any => {
  if (order && order.orderItems) {
    const correctTotal = recalculateOrderTotal(order.orderItems);
    return { ...order, totalAmount: correctTotal };
  }
  return order;
};

export const getActiveOrders = async (restaurantId: string) => {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      status: {
        // Fetches IN_PROGRESS and PENDING orders for the kitchen
        in: [OrderStatus.IN_PROGRESS, OrderStatus.PENDING],
      },
    },
    include: {
      table: true,
      restaurant: true,
      orderItems: {
        // Include all order items regardless of status
        include: {
          menuItemVariant: {
            include: {
              menuItem: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Correct totals for all orders
  return orders.map(correctOrderTotal);
};

export const getOrderDetails = async (
  orderId: string,
  restaurantId: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: {
      orderItems: {
        include: {
          // menuItem: true, // <-- REMOVED
          menuItemVariant: {
            // <-- ADDED
            include: {
              menuItem: true,
            },
          },
        },
      },
      table: true, // Also include table details
      restaurant: true, // Include restaurant details for bill receipt
    },
  });
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }
  return correctOrderTotal(order);
};

export const getActiveOrderByTable = async (
  tableId: string,
  restaurantId: string
) => {
  const order = await prisma.order.findFirst({
    where: {
      tableId,
      restaurantId,
      status: {
        notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      },
    },
    include: {
      orderItems: {
        include: {
          // menuItem: true, // <-- REMOVED
          menuItemVariant: {
            // <-- ADDED
            include: {
              menuItem: true,
            },
          },
        },
      },
      table: true,
      restaurant: true,
    },
  });

  if (!order) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No active order found for this table"
    );
  }
  return correctOrderTotal(order);
};

export const addItemsToOrder = async (
  orderId: string,
  items: Array<OrderItemInput>, // <-- Updated type
  restaurantId: string
) => {
  // getOrderDetails is now updated, so it will return the correct structure
  const order = await getOrderDetails(orderId, restaurantId);

  // 1. Fetch variants, not menu items
  const menuVariants = await prisma.menuItemVariant.findMany({
    where: {
      id: { in: items.map((item) => item.menuItemVariantId) },
      restaurantId,
    },
  });

  // 2. Validate variants
  if (menuVariants.length !== items.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "One or more menu item variants are invalid."
    );
  }

  // 3. Map variants for easy lookup
  const variantsById = new Map(menuVariants.map((v) => [v.id, v]));

  const updatedOrderWithItems = await prisma.$transaction(async (tx) => {
    let totalAmount = order.totalAmount;

    for (const item of items) {
      const variant = variantsById.get(item.menuItemVariantId);
      if (!variant) continue;

      const itemTotal = variant.price.mul(item.quantity);
      totalAmount = totalAmount.add(itemTotal);

      // Check for existing item using the variantId
      const existingOrderItem = await tx.orderItem.findFirst({
        where: { orderId, menuItemVariantId: item.menuItemVariantId },
      });

      if (existingOrderItem) {
        await tx.orderItem.update({
          where: { id: existingOrderItem.id },
          data: {
            quantity: { increment: item.quantity },
            note: item.note ?? null, // Update note if provided
          },
        });
      } else {
        await tx.orderItem.create({
          data: {
            orderId,
            restaurantId,
            menuItemVariantId: item.menuItemVariantId, // <-- Use variant ID
            quantity: item.quantity,
            price: variant.price, // <-- Use variant price
            status: OrderItemStatus.ORDERED,
            note: item.note ?? null, // <-- Add note
          },
        });
      }
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: { totalAmount, status: OrderStatus.IN_PROGRESS },
      include: {
        orderItems: {
          include: {
            menuItemVariant: {
              // <-- Updated include
              include: {
                menuItem: true,
              },
            },
          },
        },
        table: true,
        restaurant: true,
      },
    });

    return updatedOrder;
  });

  // FIX: Moved broadcast and return inside the function scope
  broadcastToRestaurant(restaurantId, {
    type: "ORDER_ITEMS_UPDATED",
    payload: updatedOrderWithItems,
  });

  return updatedOrderWithItems;
};

export const getAllOrders = async (restaurantId: string) => {
  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
    },
    include: {
      orderItems: {
        include: {
          // menuItem: true, // <-- REMOVED
          menuItemVariant: {
            // <-- ADDED
            include: {
              menuItem: true,
            },
          },
        },
      },
      table: true,
      restaurant: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Correct totals for all orders
  return orders.map(correctOrderTotal);
};

/**
 * Ingests an order payload coming from Zomato and creates a POS order.
 * This implementation is intentionally conservative: it prevents duplicates
 * by checking `sourceId`, creates a basic delivery order and attempts to
 * map items by variant name. Improve mapping logic as you add a proper
 * cross-reference table between Zomato menu IDs and POS variant IDs.
 */
export const zomatoOrderToPos = async (payload: any, restaurantId: string) => {
  // payload shape will vary. Try to extract an external order id
  const externalId =
    payload.order_id ||
    payload.orderId ||
    payload.id ||
    payload.data?.order?.id;

  if (!externalId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Missing external order id in Zomato payload"
    );
  }

  // Prevent duplicate processing
  const existing = await prisma.order.findFirst({
    where: { restaurantId, sourceId: String(externalId) },
  });
  if (existing) {
    return existing;
  }

  // Basic customer info
  const customerName =
    payload.customer?.name ||
    payload.customer_name ||
    payload.delivery?.name ||
    null;
  const customerPhone =
    payload.customer?.phone ||
    payload.customer_phone ||
    payload.delivery?.phone ||
    null;
  const deliveryAddress = payload.delivery?.address || payload.address || null;

  // Try to map items. If mapping fails, create order without items and include a note.
  const items =
    payload.items || payload.order_items || payload.data?.order?.items || [];

  // Create the order first with totalAmount 0 (we'll update after items)
  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        restaurantId,
        status: OrderStatus.PENDING,
        orderType: "DELIVERY_ZOMATO" as any,
        sourceId: String(externalId),
        customerName: customerName ?? undefined,
        customerPhone: customerPhone ?? undefined,
        deliveryAddress: deliveryAddress ?? undefined,
        totalAmount: 0,
      },
    });

    let total = 0;

    for (const it of items) {
      // Payload item name and quantity heuristics
      const name = it.name || it.item_name || it.title;
      const qty = Number(it.quantity || it.qty || it.count || 1);
      const priceFromPayload = Number(
        it.price || it.unit_price || it.rate || 0
      );

      // Try to find menuItemVariant by name within restaurant
      let variant = null;
      if (name) {
        variant = await tx.menuItemVariant.findFirst({
          where: { restaurantId, name },
        });
      }

      const price = variant
        ? Number((variant.price as any).toString())
        : priceFromPayload;
      const itemTotal = price * qty;
      total += itemTotal;

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          restaurantId,
          menuItemVariantId: variant ? variant.id : undefined,
          quantity: qty,
          price: price as any,
          status: OrderItemStatus.ORDERED,
          note: variant ? null : `Unmapped item from Zomato: ${name}`,
        } as any,
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { totalAmount: total },
      include: {
        orderItems: {
          include: {
            menuItemVariant: {
              include: { menuItem: true },
            },
          },
        },
        table: true,
        restaurant: true,
      },
    });
    return updated;
  });

  // Notify via websocket
  broadcastToRestaurant(restaurantId, {
    type: "NEW_ORDER_ZOMATO",
    payload: created,
  });

  return created;
};
