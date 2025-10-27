import { type UserRole } from "@prisma/client";
import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export class UserService {
  /**
   * If role is SUPERADMIN (string), return all users. Otherwise return only users for the restaurant.
   */
  async getAllUsers(restaurantId?: string, role?: UserRole) {
    if ((role as unknown as string) === "SUPERADMIN") {
      return prisma.user.findMany();
    }

    return prisma.user.findMany({ where: { restaurantId: restaurantId! } });
  }

  async getUserById(id: string, restaurantId?: string, role?: UserRole) {
    if ((role as unknown as string) === "SUPERADMIN") {
      return prisma.user.findUnique({ where: { id } });
    }

    return prisma.user.findFirst({
      where: { id, restaurantId: restaurantId! },
    });
  }

  async createUser(data: any, restaurantId?: string, role?: UserRole) {
    if ((role as unknown as string) === "SUPERADMIN") {
      return prisma.user.create({ data });
    }

    // ensure created user belongs to the requester's restaurant
    return prisma.user.create({
      data: { ...data, restaurantId: restaurantId! },
    });
  }

  async updateUser(
    id: string,
    data: any,
    restaurantId?: string,
    role?: UserRole
  ) {
    if ((role as unknown as string) === "SUPERADMIN") {
      return prisma.user.update({ where: { id }, data });
    }

    const existing = await prisma.user.findFirst({
      where: { id, restaurantId: restaurantId! },
    });
    if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    return prisma.user.update({ where: { id }, data });
  }

  async deleteUser(id: string, restaurantId?: string, role?: UserRole) {
    if ((role as unknown as string) === "SUPERADMIN") {
      return prisma.user.delete({ where: { id } });
    }

    const existing = await prisma.user.findFirst({
      where: { id, restaurantId: restaurantId! },
    });
    if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "User not found");

    return prisma.user.delete({ where: { id } });
  }
}
