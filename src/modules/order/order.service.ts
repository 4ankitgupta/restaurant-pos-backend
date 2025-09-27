import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderStatus, OrderItemStatus, type MenuItem } from "@prisma/client";
import { broadcastToRestaurant } from "../../websocketServer.js";

export const createOrder = async (
  orderData: {
    tableId: string;
    items: Array<{ menuItemId: string; quantity: number }>;
  },
  restaurantId: string,
  userId: string
) => {
  const { tableId, items } = orderData;

  return prisma.$transaction(async (tx) => {
    // 1. Fetch all necessary menu items at once for efficiency
    const menuItems = await tx.menuItem.findMany({
      where: {
        id: { in: items.map((item) => item.menuItemId) },
        restaurantId,
      },
    });

    // Create a Map for quick price lookups
    const menuItemsById = new Map(menuItems.map((item) => [item.id, item]));
    let totalAmount = 0;

    // 2. Calculate the total amount from the fetched menu items
    for (const item of items) {
      const menuItem = menuItemsById.get(item.menuItemId);
      if (menuItem) {
        totalAmount += Number(menuItem.price) * item.quantity;
      }
    }

    // 3. Create the order and its associated items in a single, atomic operation
    const newOrder = await tx.order.create({
      data: {
        restaurantId,
        userId,
        tableId,
        totalAmount,
        status:
          items && items.length > 0
            ? OrderStatus.IN_PROGRESS
            : OrderStatus.PENDING,
        orderItems: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: menuItemsById.get(item.menuItemId)?.price || 0,
            status: OrderItemStatus.ORDERED, // Set the correct initial status
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
        table: true,
      },
    });

    // 4. Broadcast the successful creation of the new order via WebSocket
    broadcastToRestaurant(restaurantId, {
      type: "NEW_ORDER",
      payload: newOrder,
    });

    return newOrder;
  });
};

export const addItemsToOrder = async (
  orderId: string,
  items: Array<{ menuItemId: string; quantity: number }>,
  restaurantId: string
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
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

      // The previous logic updated existing order items. With the new schema,
      // you requested new entries for additional items, so we'll just create.
      await tx.orderItem.create({
        data: {
          orderId,
          restaurantId,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price,
          status: OrderItemStatus.ORDERED, // Set the correct initial status
        },
      });
    }

    // Update the overall order status to IN_PROGRESS if it was PENDING
    let updatedOrder = order;
    if (order.status === OrderStatus.PENDING) {
      updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.IN_PROGRESS },
      });
    }

    // Recalculate the total amount
    const newTotalAmount = await tx.orderItem.aggregate({
      _sum: { price: true, quantity: true },
      where: { orderId: orderId },
    });

    // Update the order with the new total amount
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

// This function is no longer needed in its original form since order status is derived from item statuses.
// The new logic for updating order status is handled within the updateOrderItemStatus function in chef.service.ts
// or can be manually updated in the front-end logic. For now, this is kept for reference but should be removed or
// heavily modified if used.
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  restaurantId: string
) => {
  const order = await prisma.order.update({
    where: { id: orderId, restaurantId },
    data: { status },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      table: true,
    },
  });

  broadcastToRestaurant(restaurantId, {
    type: "ORDER_STATUS_UPDATE",
    payload: order,
  });

  return order;
};

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
