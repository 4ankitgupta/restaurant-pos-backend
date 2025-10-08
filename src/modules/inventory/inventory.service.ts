import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { StockChangeType } from "@prisma/client";

export const getAllInventoryItems = async (restaurantId: string) => {
  return prisma.inventoryItem.findMany({ where: { restaurantId } });
};

export const getInventoryItemById = async (
  id: string,
  restaurantId: string
) => {
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: { id, restaurantId },
  });
  if (!inventoryItem) {
    throw new ApiError(httpStatus.NOT_FOUND, "Inventory item not found");
  }
  return inventoryItem;
};

export const createInventoryItem = async (
  itemData: {
    name: string;
    unit: string;
    currentStock?: number;
    reorderLevel?: number;
  },
  restaurantId: string
) => {
  return prisma.$transaction(async (tx) => {
    const inventoryItem = await tx.inventoryItem.create({
      data: {
        ...itemData,
        restaurantId,
      },
    });

    await tx.stockLog.create({
      data: {
        restaurantId,
        inventoryItemId: inventoryItem.id,
        changeType: StockChangeType.ADD,
        quantity: inventoryItem.currentStock,
        remarks: "New item created",
      },
    });

    return inventoryItem;
  });
};

export const updateInventoryItem = async (
  id: string,
  itemData: {
    name?: string;
    unit?: string;
    reorderLevel?: number;
  },
  restaurantId: string
) => {
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: { id, restaurantId },
  });

  if (!inventoryItem) {
    throw new ApiError(httpStatus.NOT_FOUND, "Inventory item not found");
  }

  return prisma.inventoryItem.update({
    where: { id },
    data: itemData,
  });
};

export const deleteInventoryItem = async (id: string, restaurantId: string) => {
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: { id, restaurantId },
  });

  if (!inventoryItem) {
    throw new ApiError(httpStatus.NOT_FOUND, "Inventory item not found");
  }

  return prisma.$transaction(async (tx) => {
    await tx.stockLog.create({
      data: {
        restaurantId,
        inventoryItemId: inventoryItem.id,
        changeType: StockChangeType.REMOVE,
        quantity: inventoryItem.currentStock,
        remarks: "Item deleted",
      },
    });

    return tx.inventoryItem.delete({ where: { id } });
  });
};

export const adjustStock = async (
  id: string,
  adjustmentData: {
    changeType: StockChangeType;
    quantity: number;
    remarks?: string;
  },
  restaurantId: string
) => {
  const { changeType, quantity, remarks } = adjustmentData;

  return prisma.$transaction(async (tx) => {
    const inventoryItem = await tx.inventoryItem.update({
      where: { id, restaurantId },
      data: {
        currentStock: {
          increment: changeType === StockChangeType.ADD ? quantity : -quantity,
        },
      },
    });

    await tx.stockLog.create({
      data: {
        restaurantId,
        inventoryItemId: id,
        changeType,
        quantity,
        remarks,
      },
    });

    return inventoryItem;
  });
};
