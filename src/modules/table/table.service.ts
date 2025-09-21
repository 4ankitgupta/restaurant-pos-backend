import prisma from "../../db/index.js";

export const getAllTables = async (restaurantId: string) => {
  return prisma.table.findMany({ where: { restaurantId } });
};
