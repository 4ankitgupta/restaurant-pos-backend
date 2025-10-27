import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import {
  OrderStatus,
  OrderItemStatus,
  PaymentStatus,
  type MenuItem,
} from "@prisma/client";
import { broadcastToRestaurant } from "../../websocketServer.js";

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
          menuItem: true,
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
          menuItem: true,
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
  items: Array<{ menuItemId: string; quantity: number }>,
  restaurantId: string
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    const menuItems = await tx.menuItem.findMany({
      where: {
        id: { in: items.map((item) => item.menuItemId) },
        restaurantId,
      },
    });

    if (menuItems.length !== items.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "One or more menu items are invalid."
      );
    }

    let totalAmount = order.totalAmount;

    for (const item of items) {
      const menuItem = menuItems.find(
        (mi: MenuItem) => mi.id === item.menuItemId
      );
      if (!menuItem) continue;

      const itemTotal = menuItem.price.mul(item.quantity);
      totalAmount = totalAmount.add(itemTotal);

      await tx.orderItem.create({
        data: {
          orderId,
          restaurantId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price,
          status: OrderItemStatus.SERVED,
        },
      });
    }

    const finalOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        totalAmount: totalAmount,
      },
      include: { orderItems: true },
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
    items: Array<{ menuItemId: string; quantity: number }>;
  },
  restaurantId: string,
  userId: string
) => {
  const { items } = orderData;

  return prisma.$transaction(async (tx) => {
    const menuItems = await tx.menuItem.findMany({
      where: {
        id: { in: items.map((item) => item.menuItemId) },
        restaurantId,
      },
    });

    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));
    let totalAmount = 0;

    for (const item of items) {
      const menuItem = menuItemsById.get(item.menuItemId);
      if (menuItem) {
        totalAmount += Number(menuItem.price) * item.quantity;
      }
    }

    const newOrder = await tx.order.create({
      data: {
        restaurantId,
        userId,
        totalAmount,
        takeAway: true,
        status: OrderStatus.IN_PROGRESS,
        orderItems: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItemsById.get(item.menuItemId)?.price || 0,
            status: OrderItemStatus.ORDERED,
            restaurantId,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
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
