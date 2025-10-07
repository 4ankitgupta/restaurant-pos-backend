import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

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
  return prisma.inventoryItem.create({
    data: {
      ...itemData,
      restaurantId,
    },
  });
};

export const updateInventoryItem = async (
  id: string,
  itemData: {
    name?: string;
    unit?: string;
    currentStock?: number;
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

  return prisma.inventoryItem.delete({ where: { id } });
};
