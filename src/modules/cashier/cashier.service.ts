import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import {
  OrderStatus,
  OrderItemStatus,
  PaymentStatus,
  type MenuItemVariant,
} from "@prisma/client";
import { broadcastToRestaurant } from "../../websocketServer.js";

// Define the item type for validation
type OrderItemInput = {
  menuItemVariantId: string;
  quantity: number;
  note?: string;
};

export const getActiveAndUnpaidOrders = async (restaurantId: string) => {
  return prisma.order.findMany({
    where: {
      restaurantId,
      OR: [
        { status: { in: [OrderStatus.IN_PROGRESS, OrderStatus.PENDING] } },
        { paymentStatus: PaymentStatus.UNPAID },
      ],
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
      createdAt: "asc",
    },
  });
};

export const getCompletedOrders = async (restaurantId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.order.findMany({
    where: {
      restaurantId,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      createdAt: {
        gte: today,
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
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const addItemsToOrder = async (
  orderId: string,
  items: Array<OrderItemInput>, // <-- Updated type
  restaurantId: string
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    // 1. Fetch the menuItemVariants
    const variantIds = items.map((item) => item.menuItemVariantId);
    const menuVariants = await tx.menuItemVariant.findMany({
      where: {
        id: { in: variantIds },
        restaurantId,
      },
    });

    // 2. Validate all variants were found
    if (menuVariants.length !== variantIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "One or more menu item variants are invalid."
      );
    }

    // 3. Map variants for easy lookup and prepare for creation
    const variantsById = new Map<string, MenuItemVariant>(
      menuVariants.map((variant) => [variant.id, variant])
    );
    let totalAmountToAdd = 0;

    const orderItemsToCreate = items.map((item) => {
      const variant = variantsById.get(item.menuItemVariantId);
      if (!variant) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Variant mismatch"
        );
      }
      const itemTotal = Number(variant.price) * item.quantity;
      totalAmountToAdd += itemTotal;

      return {
        orderId,
        restaurantId,
        menuItemVariantId: item.menuItemVariantId,
        quantity: item.quantity,
        price: variant.price, // <-- Get price from variant
        note: item.note ?? null, // <-- Add the note
        status: OrderItemStatus.SERVED, // Cashier adds items as SERVED
      };
    });

    // 4. Create all new order items
    await tx.orderItem.createMany({
      data: orderItemsToCreate,
    });

    // 5. Update the order total
    const newTotalAmount = Number(order.totalAmount) + totalAmountToAdd;

    const finalOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        totalAmount: newTotalAmount,
      },
      include: {
        orderItems: {
          include: {
            menuItemVariant: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    broadcastToRestaurant(restaurantId, {
      type: "ORDER_ITEMS_UPDATED",
      payload: finalOrder,
    });

    return finalOrder;
  });
};

export const createTakeawayOrder = async (
  orderData: {
    items: Array<OrderItemInput>; // <-- Updated type
  },
  restaurantId: string,
  userId: string
) => {
  const { items } = orderData;

  return prisma.$transaction(async (tx) => {
    // 1. Fetch the menuItemVariants
    const variantIds = items.map((item) => item.menuItemVariantId);
    const menuVariants = await tx.menuItemVariant.findMany({
      where: {
        id: { in: variantIds },
        restaurantId,
      },
    });

    // 2. Validate all variants were found
    if (menuVariants.length !== variantIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "One or more menu item variants are invalid."
      );
    }

    // 3. Map variants for easy lookup and calculate total
    const variantsById = new Map(
      menuVariants.map((variant) => [variant.id, variant])
    );
    let totalAmount = 0;

    for (const item of items) {
      const variant = variantsById.get(item.menuItemVariantId);
      if (variant) {
        totalAmount += Number(variant.price) * item.quantity;
      }
    }

    // 4. Create the order
    const newOrder = await tx.order.create({
      data: {
        restaurantId,
        userId,
        totalAmount,
        takeAway: true,
        status: OrderStatus.IN_PROGRESS, // Takeaway starts in progress
        orderItems: {
          create: items.map((item) => {
            const variant = variantsById.get(item.menuItemVariantId);
            return {
              menuItemVariant: {
                connect: { id: item.menuItemVariantId },
              }, // <-- Use variant ID
              quantity: item.quantity,
              price: variant?.price || 0, // <-- Get price from variant
              note: item.note ?? null, // <-- Add the note, convert undefined to null
              status: OrderItemStatus.ORDERED, // Starts as ORDERED
              restaurant: {
                connect: { id: restaurantId },
              },
            };
          }),
        },
      },
      include: {
        orderItems: {
          include: {
            menuItemVariant: {
              // <-- Include variant
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    broadcastToRestaurant(restaurantId, {
      type: "NEW_ORDER",
      payload: newOrder,
    });

    return newOrder;
  });
};
