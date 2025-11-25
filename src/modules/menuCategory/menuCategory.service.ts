import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export const getAllMenuCategories = async (restaurantId: string) => {
  return prisma.menuCategory.findMany({ where: { restaurantId } });
};

export const createMenuCategory = async (
  categoryData: { name: string; nameHindi?: string; description?: string },
  restaurantId: string
) => {
  const { name, nameHindi, description } = categoryData;
  return prisma.menuCategory.create({
    data: {
      name,
      restaurantId,
      ...(nameHindi && { nameHindi }),
      ...(description && { description }),
    },
  });
};

export const updateMenuCategory = async (
  categoryId: string,
  categoryData: { name?: string; nameHindi?: string; description?: string },
  restaurantId: string
) => {
  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Menu category not found");
  }

  return prisma.menuCategory.update({
    where: { id: categoryId },
    data: categoryData,
  });
};

export const deleteMenuCategory = async (
  categoryId: string,
  restaurantId: string
) => {
  const category = await prisma.menuCategory.findFirst({
    where: { id: categoryId, restaurantId },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Menu category not found");
  }

  return prisma.menuCategory.delete({ where: { id: categoryId } });
};
