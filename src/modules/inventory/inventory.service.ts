import prisma from "../../db/index.js";

export const getAllInventoryItems = async (restaurantId: string) => {
  return prisma.inventoryItem.findMany({ where: { restaurantId } });
};
