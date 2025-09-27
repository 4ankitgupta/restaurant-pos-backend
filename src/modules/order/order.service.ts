import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderStatus } from "@prisma/client";

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
