// src/modules/order/order.service.ts

import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderStatus, TableStatus } from "@prisma/client";
import { broadcastToRoom } from "../../websocket/websocket.js";

// --- NEW ---
export const getOrderDetails = async (
  orderId: string,
  restaurantId: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { orderItems: { include: { menuItem: true } } },
  });
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }
  return order;
};

// --- NEW ---
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
  });

  if (!order) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "No active order found for this table"
    );
  }
  return order;
};

// --- MODIFIED: Renamed and repurposed from createOrder ---
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

  // Use a transaction to ensure atomicity
  const updatedOrderWithItems = await prisma.$transaction(async (tx) => {
    let totalAmount = order.totalAmount;

    for (const item of items) {
      const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
      if (!menuItem) continue; // Should not happen due to the check above

      const itemTotal = menuItem.price.mul(item.quantity); // price * quantity
      totalAmount = totalAmount.add(itemTotal);

      // Check if item already exists in the order
      const existingOrderItem = await tx.orderItem.findFirst({
        where: { orderId, menuItemId: item.menuItemId },
      });

      if (existingOrderItem) {
        // Update quantity if item exists
        await tx.orderItem.update({
          where: { id: existingOrderItem.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        // Create new order item if it doesn't exist
        await tx.orderItem.create({
          data: {
            orderId,
            restaurantId,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItem.price,
            status: "ORDERED", // Set status to ORDERED
          },
        });
      }
    }

    // Update the order's total amount and status
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        totalAmount,
        status: order.status === "PENDING" ? "IN_PROGRESS" : order.status,
      },
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

  // Broadcast the updated order to the restaurant's room
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
