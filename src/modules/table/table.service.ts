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

export const createTable = async (
  restaurantId: string,
  payload: {
    tableNumber: string;
    capacity: number;
    status?: TableStatus;
  }
) => {
  const existingTable = await prisma.table.findFirst({
    where: {
      restaurantId,
      tableNumber: payload.tableNumber,
    },
  });

  if (existingTable) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A table with this number already exists"
    );
  }

  return prisma.table.create({
    data: {
      restaurantId,
      tableNumber: payload.tableNumber,
      capacity: payload.capacity,
      status: payload.status ?? TableStatus.Available,
    },
  });
};

export const updateTable = async (
  tableId: string,
  restaurantId: string,
  updates: {
    tableNumber?: string;
    capacity?: number;
    status?: TableStatus;
  }
) => {
  const existingTable = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
  });

  if (!existingTable) {
    throw new ApiError(httpStatus.NOT_FOUND, "Table not found");
  }

  if (
    updates.tableNumber &&
    updates.tableNumber !== existingTable.tableNumber
  ) {
    const conflict = await prisma.table.findFirst({
      where: {
        restaurantId,
        tableNumber: updates.tableNumber,
        NOT: { id: tableId },
      },
    });

    if (conflict) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "Another table with this number already exists"
      );
    }
  }

  return prisma.table.update({
    where: { id: tableId },
    data: {
      tableNumber: updates.tableNumber ?? existingTable.tableNumber,
      capacity: updates.capacity ?? existingTable.capacity,
      status: updates.status ?? existingTable.status,
    },
  });
};

export const deleteTable = async (tableId: string, restaurantId: string) => {
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurantId },
    include: {
      orders: {
        where: {
          status: {
            in: [OrderStatus.PENDING, OrderStatus.IN_PROGRESS],
          },
        },
      },
    },
  });

  if (!table) {
    throw new ApiError(httpStatus.NOT_FOUND, "Table not found");
  }

  if (
    table.status === TableStatus.Occupied ||
    table.status === TableStatus.NeedCleaning
  ) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete a table that is currently in use"
    );
  }

  if (table.orders.length > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete a table with active orders"
    );
  }

  return prisma.table.delete({
    where: { id: tableId },
  });
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
