// src/modules/order/order.service.ts

import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderStatus, OrderItemStatus } from "@prisma/client";
import { broadcastToRoom } from "../../websocket/websocket.js";

// Define the item type for validation, as this file also has addItemsToOrder
type OrderItemInput = {
  menuItemVariantId: string;
  quantity: number;
  note?: string;
};

export const getActiveOrders = async (restaurantId: string) => {
  return prisma.order.findMany({
    where: {
      restaurantId,
      status: {
        // Correctly fetches IN_PROGRESS orders for the kitchen
        in: [OrderStatus.IN_PROGRESS, OrderStatus.PENDING],
      },
    },
    include: {
      table: true,
      orderItems: {
        where: {
          // Fetches only items the kitchen needs to act on
          status: {
            in: [OrderItemStatus.ORDERED, OrderItemStatus.PREPARING],
          },
        },
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
    },
    orderBy: {
      createdAt: "asc",
    },
  });
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
    },
  });
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }
  return order;
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
    },
  });

  if (!order) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No active order found for this table"
    );
  }
  return order;
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
      },
    });

    return updatedOrder;
  });

  // FIX: Moved broadcast and return inside the function scope
  broadcastToRoom(
    `restaurant:${restaurantId}`,
    "ORDER_ITEMS_UPDATED",
    updatedOrderWithItems
  );

  return updatedOrderWithItems;
};

export const getAllOrders = async (restaurantId: string) => {
  return prisma.order.findMany({
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};
