// src/modules/chef/chef.service.ts

import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderItemStatus } from "@prisma/client";
import { broadcastToRestaurant } from "../../websocketServer.js";

/**
 * Gets all orders that have at least one item in the 'PREPARING' state.
 */
export const getPreparingOrders = async (restaurantId: string) => {
  return prisma.order.findMany({
    where: {
      restaurantId,
      orderItems: {
        some: {
          status: OrderItemStatus.PREPARING,
        },
      },
    },
    include: {
      orderItems: {
        where: {
          status: OrderItemStatus.PREPARING,
        },
        include: {
          menuItem: true,
        },
      },
      table: true,
    },
    orderBy: {
      createdAt: "asc", // Oldest orders with preparing items first
    },
  });
};

/**
 * Updates the status of a specific order item.
 */
export const updateOrderItemStatus = async (
  orderItemId: string,
  status: OrderItemStatus,
  restaurantId: string
) => {
  const orderItem = await prisma.orderItem.findFirst({
    where: { id: orderItemId, restaurantId },
  });

  if (!orderItem) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order item not found");
  }

  // Logic for status transitions can be added here
  // For example:
  // if (orderItem.status === OrderItemStatus.ORDERED && status === OrderItemStatus.PREPARING) { ... }
  // You mentioned the logic would be decided later. This is where it would go.

  const updatedOrderItem = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status },
    include: { order: { include: { orderItems: true, table: true } } },
  });

  // Update the overall order status based on item statuses
  const allItems = updatedOrderItem.order.orderItems;
  const allItemsServed = allItems.every(
    (item) =>
      item.status === OrderItemStatus.SERVED ||
      item.status === OrderItemStatus.CANCELLED
  );
  if (allItemsServed) {
    // Ensure the order belongs to the same restaurant before updating it.
    const order = updatedOrderItem.order;
    if (!order || (order as any).restaurantId !== restaurantId) {
      // If there is a mismatch, act like the resource doesn't exist to avoid info leak
      throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    await prisma.order.update({
      where: { id: updatedOrderItem.orderId },
      data: { status: "COMPLETED" },
    });
  }

  // Broadcast the update to all connected clients
  broadcastToRestaurant(restaurantId, {
    type: "ORDER_ITEM_STATUS_UPDATE",
    payload: updatedOrderItem,
  });

  return updatedOrderItem;
};
