import prisma from "../../db/index.js";

export const getAllMenuCategories = async (restaurantId: string) => {
  return prisma.menuCategory.findMany({ where: { restaurantId } });
};
