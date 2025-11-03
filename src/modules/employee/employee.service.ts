import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export const createEmployee = async (
  data: {
    name: string;
    employeeCode: string;
    biometricId?: string;
    userId?: string;
  },
  restaurantId: string
) => {
  // Check if employee code is unique for this restaurant
  const existingCode = await prisma.employee.findFirst({
    where: { employeeCode: data.employeeCode, restaurantId },
  });
  if (existingCode) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "An employee with this code already exists"
    );
  }

  // If userId is provided, check if it's already linked
  if (data.userId) {
    const existingUserLink = await prisma.employee.findFirst({
      where: { userId: data.userId, restaurantId },
    });
    if (existingUserLink) {
      throw new ApiError(
        httpStatus.CONFLICT,
        "This user is already linked to another employee"
      );
    }
  }

  return prisma.employee.create({
    data: {
      ...data,
      restaurantId,
    },
  });
};

export const getAllEmployees = (restaurantId: string) => {
  return prisma.employee.findMany({
    where: { restaurantId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

export const updateEmployee = async (
  employeeId: string,
  data: {
    name?: string;
    employeeCode?: string;
    biometricId?: string;
    userId?: string | null;
    isActive?: boolean;
  },
  restaurantId: string
) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, restaurantId },
  });

  if (!employee) {
    throw new ApiError(httpStatus.NOT_FOUND, "Employee not found");
  }

  // TODO: Add validation checks for uniqueness if employeeCode or userId is being changed

  return prisma.employee.update({
    where: { id: employeeId },
    data,
  });
};
