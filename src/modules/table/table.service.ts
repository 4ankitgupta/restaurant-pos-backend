import prisma from "../../db/index.js";
import { TableStatus } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export const getAllTables = async (restaurantId: string) => {
  return prisma.table.findMany({ where: { restaurantId } });
};

export const allocateTable = async (
  tableId: string,
  orderId: string,
  partySize: number,
  restaurantId: string
) => {
  // --- Start of Fix ---

  // 1. Verify the order exists before doing anything else
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  // --- End of Fix ---

  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });

  if (!table) {
    throw new ApiError(httpStatus.NOT_FOUND, "Table not found");
  }

  if (table.capacity < partySize) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Party size exceeds table capacity"
    );
  }

  if (table.status !== TableStatus.Available) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Table is not available");
  }

  // Now this update is safe because we know the order exists
  await prisma.order.update({
    where: { id: orderId },
    data: { tableId },
  });

  return prisma.table.update({
    where: { id: tableId },
    data: { status: TableStatus.Occupied },
  });
};

export const updateTableStatus = async (
  tableId: string,
  status: TableStatus,
  restaurantId: string
) => {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });

  if (!table) {
    throw new ApiError(httpStatus.NOT_FOUND, "Table not found");
  }

  return prisma.table.update({
    where: { id: tableId },
    data: { status },
  });
};
