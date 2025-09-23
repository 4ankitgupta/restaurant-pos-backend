// src/modules/chef/chef.service.ts

import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { OrderStatus } from "@prisma/client";

export const getPreparingOrders = async (restaurantId: string) => {
  return prisma.order.findMany({
    where: {
      restaurantId,
      status: OrderStatus.PREPARING,
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
      createdAt: "asc", // Oldest orders first
    },
  });
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  restaurantId: string
) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  // Add any specific logic here, for example, a chef should only be able
  // to change the status from PREPARING to PREPARED.
  if (order.status !== OrderStatus.PREPARING) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Order is not in 'PREPARING' state.`
    );
  }

  if (status !== OrderStatus.PREPARED) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Chef can only mark order as 'PREPARED'.`
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status },
  });
};
