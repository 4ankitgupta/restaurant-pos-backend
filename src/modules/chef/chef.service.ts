// src/modules/chef/chef.service.ts

import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderItemStatus, OrderStatus } from "@prisma/client";
import { broadcastToRestaurant } from "../../websocketServer.js";

/**
 * Gets all active orders (IN_PROGRESS or PENDING) with all order items.
 */
export const getPreparingOrders = async (restaurantId: string) => {
  return prisma.order.findMany({
    where: {
      restaurantId,
      status: {
        in: [OrderStatus.IN_PROGRESS, OrderStatus.PENDING],
      },
    },
    include: {
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
      table: true,
    },
    orderBy: {
      createdAt: "asc", // Oldest orders first
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
    include: {
      // Include variant info for the item that was *just* updated
      menuItemVariant: {
        include: {
          menuItem: true,
        },
      },
      order: {
        include: {
          orderItems: {
            // Also include variant info for all other items in the order
            include: {
              menuItemVariant: {
                include: {
                  menuItem: true,
                },
              },
            },
          },
          table: true,
        },
      },
    },
  });

  // Update the overall order status based on item statuses
  // Check if all items in the *full order* are served or cancelled
  const allItems = updatedOrderItem.order.orderItems;
  const allItemsServedOrCancelled = allItems.every(
    (item) =>
      item.status === OrderItemStatus.SERVED ||
      item.status === OrderItemStatus.CANCELLED
  );

  if (allItemsServedOrCancelled) {
    // Ensure the order belongs to the same restaurant before updating it.
    const order = updatedOrderItem.order;
    if (!order || (order as any).restaurantId !== restaurantId) {
      // If there is a mismatch, act like the resource doesn't exist to avoid info leak
      throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    // Check if all items are cancelled to set the final order status
    const allItemsCancelled = allItems.every(
      (item) => item.status === OrderItemStatus.CANCELLED
    );
    const newStatus = allItemsCancelled
      ? OrderStatus.CANCELLED
      : OrderStatus.COMPLETED;

    if (order.status !== newStatus) {
      await prisma.order.update({
        where: { id: updatedOrderItem.orderId },
        data: { status: newStatus },
      });
    }
  }

  // Broadcast the update to all connected clients
  broadcastToRestaurant(restaurantId, {
    type: "ORDER_ITEM_STATUS_UPDATE",
    payload: updatedOrderItem,
  });

  return updatedOrderItem;
};
