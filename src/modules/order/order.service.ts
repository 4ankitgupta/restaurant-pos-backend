// src/modules/order/order.service.ts

import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderStatus, OrderItemStatus } from "@prisma/client";
import { broadcastToRoom } from "../../websocket/websocket.js";

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
          menuItem: true,
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
          menuItem: true,
        },
      },
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
          menuItem: true,
        },
      },
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
  items: Array<{ menuItemId: string; quantity: number }>,
  restaurantId: string
) => {
  const order = await getOrderDetails(orderId, restaurantId);

  const menuItems = await prisma.menuItem.findMany({
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

  const updatedOrderWithItems = await prisma.$transaction(async (tx) => {
    let totalAmount = order.totalAmount;

    for (const item of items) {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) continue;

      const itemTotal = menuItem.price.mul(item.quantity);
      totalAmount = totalAmount.add(itemTotal);

      const existingOrderItem = await tx.orderItem.findFirst({
        where: { orderId, menuItemId: item.menuItemId },
      });

      if (existingOrderItem) {
        await tx.orderItem.update({
          where: { id: existingOrderItem.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await tx.orderItem.create({
          data: {
            orderId,
            restaurantId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItem.price,
            status: OrderItemStatus.ORDERED,
          },
        });
      }
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      // FIX: Changed status to IN_PROGRESS to match your schema and logic
      data: { totalAmount, status: OrderStatus.IN_PROGRESS },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
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
