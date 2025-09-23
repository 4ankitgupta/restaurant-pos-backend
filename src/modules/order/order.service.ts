import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderStatus, TableStatus, type MenuItem } from "@prisma/client";

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

  // Use a transaction to create the order and order items
  return prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        restaurantId,
        userId,
        tableId,
        totalAmount: 0,
        status: OrderStatus.PENDING,
      },
    });

    if (items && items.length > 0) {
      return addItemsToOrder(newOrder.id, items, restaurantId, tx);
    }

    return newOrder;
  });
};

export const addItemsToOrder = async (
  orderId: string,
  items: Array<{ menuItemId: string; quantity: number }>,
  restaurantId: string,
  tx: any = prisma // Allow passing a transaction client
) => {
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
          ? OrderStatus.PREPARING
          : order.status,
    },
    include: { orderItems: true },
  });

  return updatedOrder;
};

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
