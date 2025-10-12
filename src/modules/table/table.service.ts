import prisma from "../../db/index.js";
import { TableStatus, OrderStatus } from "@prisma/client";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

// export const getAllTables = async (restaurantId: string) => {
//   return prisma.table.findMany({ where: { restaurantId } });
// };

export const getAllTables = async (restaurantId: string) => {
  // 1. Fetch tables and include their active orders
  const tablesWithOrders = await prisma.table.findMany({
    where: { restaurantId },
    include: {
      orders: {
        where: {
          status: {
            in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
          },
        },
        // Get the most recent active order if there are multiple
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  // 2. Map the results to the desired format
  const tables = tablesWithOrders.map((table) => {
    const { orders, ...tableData } = table;
    const activeOrder = orders[0]; // Get the first (and only) order from the array

    return {
      ...tableData,
      // Add orderStatus if the table is Occupied and has an active order, otherwise null
      orderStatus:
        table.status === TableStatus.Occupied && activeOrder
          ? activeOrder.status
          : null,
    };
  });

  return tables;
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
