import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { Prisma } from "@prisma/client";

export const getAllSuppliers = (restaurantId: string) => {
  return prisma.supplier.findMany({ where: { restaurantId } });
};

export const getSupplierById = async (id: string, restaurantId: string) => {
  const supplier = await prisma.supplier.findFirst({
    where: { id, restaurantId },
  });
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }
  return supplier;
};

export const createSupplier = (
  data: Prisma.SupplierCreateInput,
  restaurantId: string
) => {
  return prisma.supplier.create({
    data: {
      ...data,
      restaurant: { connect: { id: restaurantId } },
    },
  });
};

export const updateSupplier = async (
  id: string,
  data: Prisma.SupplierUpdateInput,
  restaurantId: string
) => {
  await getSupplierById(id, restaurantId); // check if exists
  return prisma.supplier.update({ where: { id }, data });
};

export const deleteSupplier = async (id: string, restaurantId: string) => {
  await getSupplierById(id, restaurantId); // check if exists
  return prisma.supplier.delete({ where: { id } });
};
