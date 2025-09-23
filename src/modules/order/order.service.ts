import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderStatus, type MenuItem } from "@prisma/client";
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

  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });

  if (!table) {
    throw new ApiError(httpStatus.NOT_FOUND, "Table not found");
  }

  const newOrder = await prisma.order.create({
    data: {
      restaurantId,
      userId,
      tableId,
      totalAmount: 0,
      status: OrderStatus.PENDING,
    },
  });

  const updatedOrder = await addItemsToOrder(newOrder.id, items, restaurantId);

  broadcastToRestaurant(restaurantId, {
    type: "NEW_ORDER",
    payload: updatedOrder,
  });

  return updatedOrder;
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
          },
        });
      }
    }
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        totalAmount,
        status:
          order.status === OrderStatus.PENDING
            ? OrderStatus.ORDERED
            : order.status,
      },
      include: { orderItems: true },
    });

    broadcastToRestaurant(restaurantId, {
      type: "ORDER_ITEMS_UPDATED",
      payload: updatedOrder,
    });

    return updatedOrder;
  });
};

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
