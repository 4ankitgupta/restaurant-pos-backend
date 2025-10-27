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
        table: true,
      },
    });

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
          status: OrderItemStatus.ORDERED,
        },
      });
    }

    let updatedOrder = order;
    if (order.status === OrderStatus.PENDING) {
      updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.IN_PROGRESS },
      });
    }

    const newTotalAmount = await tx.orderItem.aggregate({
      _sum: { price: true, quantity: true },
      where: { orderId: orderId },
    });

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

  const updatedOrderItem = await prisma.orderItem.update({
    where: { id: orderItemId },
    data: { status },
    include: { order: { include: { orderItems: true, table: true } } },
  });

  broadcastToRestaurant(restaurantId, {
    type: "ORDER_ITEM_STATUS_UPDATE",
    payload: updatedOrderItem,
  });

  return updatedOrderItem;
};

export const completeOrder = async (orderId: string, restaurantId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { orderItems: true },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.orderItems.length === 0) {
    // If there are no order items, the order can be cancelled
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
    broadcastToRestaurant(restaurantId, {
      type: "ORDER_STATUS_UPDATE",
      payload: updatedOrder,
    });
    return updatedOrder;
  }

  const allItemsServedOrCancelled = order.orderItems.every(
    (item) =>
      item.status === OrderItemStatus.SERVED ||
      item.status === OrderItemStatus.CANCELLED
  );

  if (!allItemsServedOrCancelled) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Not all items are served or cancelled."
    );
  }

  const allItemsCancelled = order.orderItems.every(
    (item) => item.status === OrderItemStatus.CANCELLED
  );

  const newStatus = allItemsCancelled
    ? OrderStatus.CANCELLED
    : OrderStatus.COMPLETED;

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  broadcastToRestaurant(restaurantId, {
    type: "ORDER_STATUS_UPDATE",
    payload: updatedOrder,
  });

  return updatedOrder;
};
