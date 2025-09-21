import prisma from "../../db/index.js";
import { TableStatus, OrderStatus } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export const getAllTables = async (restaurantId: string) => {
  return prisma.table.findMany({ where: { restaurantId } });
};

// --- NEW: Replaces the old allocateTable ---
export const seatTable = async (
  tableId: string,
  partySize: number,
  restaurantId: string,
  userId: string
) => {
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

  // Use a transaction to seat the table and create an order
  return prisma.$transaction(async (tx) => {
    const updatedTable = await tx.table.update({
      where: { id: tableId },
      data: { status: TableStatus.Occupied },
    });

    const newOrder = await tx.order.create({
      data: {
        restaurantId,
        userId,
        tableId,
        totalAmount: 0,
        status: OrderStatus.PENDING,
      },
    });

    return { updatedTable, newOrder };
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
