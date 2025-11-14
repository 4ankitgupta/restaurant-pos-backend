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

  const updatedOrderItem = await prisma.$transaction(async (tx) => {
    const item = await tx.orderItem.update({
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

    // Recalculate order total excluding cancelled items
    const allItems = item.order.orderItems;
    const newTotalAmount = allItems
      .filter((orderItem) => orderItem.status !== OrderItemStatus.CANCELLED)
      .reduce((sum, orderItem) => {
        return sum + Number(orderItem.price) * orderItem.quantity;
      }, 0);

    // Update the overall order status based on item statuses
    // Check if all items in the *full order* are served or cancelled
    const allItemsServedOrCancelled = allItems.every(
      (orderItem) =>
        orderItem.status === OrderItemStatus.SERVED ||
        orderItem.status === OrderItemStatus.CANCELLED
    );

    let orderUpdateData: any = { totalAmount: newTotalAmount };

    if (allItemsServedOrCancelled) {
      // Ensure the order belongs to the same restaurant before updating it.
      const order = item.order;
      if (!order || (order as any).restaurantId !== restaurantId) {
        // If there is a mismatch, act like the resource doesn't exist to avoid info leak
        throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
      }

      // Check if all items are cancelled to set the final order status
      const allItemsCancelled = allItems.every(
        (orderItem) => orderItem.status === OrderItemStatus.CANCELLED
      );
      const newStatus = allItemsCancelled
        ? OrderStatus.CANCELLED
        : OrderStatus.COMPLETED;

      if (order.status !== newStatus) {
        orderUpdateData.status = newStatus;
      }
    }

    // Update the order with the recalculated total and possibly new status
    await tx.order.update({
      where: { id: item.orderId },
      data: orderUpdateData,
    });

    // Update the order object with the new total for the broadcast
    item.order.totalAmount = newTotalAmount as any;
    if (orderUpdateData.status) {
      item.order.status = orderUpdateData.status;
    }

    return item;
  });

  // Broadcast the update to all connected clients
  broadcastToRestaurant(restaurantId, {
    type: "ORDER_ITEM_STATUS_UPDATE",
    payload: updatedOrderItem,
  });

  return updatedOrderItem;
};
