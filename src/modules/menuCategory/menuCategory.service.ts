import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export const getAllMenuCategories = async (restaurantId: string) => {
  return prisma.menuCategory.findMany({
    where: { restaurantId },
    orderBy: { sortOrder: "asc" },
  });
};

export const createMenuCategory = async (
  categoryData: {
    name: string;
    nameHindi?: string;
    description?: string;
    sortOrder?: number;
  },
  restaurantId: string
) => {
  const { name, nameHindi, description, sortOrder } = categoryData;
  return prisma.menuCategory.create({
    data: {
      name,
      restaurantId,
      ...(nameHindi && { nameHindi }),
      ...(description && { description }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });
};

export const updateMenuCategory = async (
  categoryId: string,
  categoryData: {
    name?: string;
    nameHindi?: string;
    description?: string;
    sortOrder?: number;
  },
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

export const reorderMenuCategories = async (
  categoryIds: string[],
  restaurantId: string
) => {
  // Verify all categories belong to this restaurant
  const categories = await prisma.menuCategory.findMany({
    where: { id: { in: categoryIds }, restaurantId },
  });

  if (categories.length !== categoryIds.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category IDs");
  }

  // Update sortOrder for each category in a transaction
  await prisma.$transaction(
    categoryIds.map((id, index) =>
      prisma.menuCategory.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  return getAllMenuCategories(restaurantId);
};
