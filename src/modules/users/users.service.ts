import { type UserRole } from "@prisma/client";
import bcrypt from "bcrypt";
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

  async changePassword(
    targetUserId: string,
    requesterId: string,
    adminPassword: string,
    newPassword: string,
    restaurantId?: string,
    role?: UserRole
  ) {
    // Step 1: Verify the admin user making the request
    const adminUser = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { id: true, passwordHash: true, restaurantId: true },
    });

    if (!adminUser) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Admin user not found");
    }

    // Step 2: Verify the admin's password
    const isPasswordValid = await bcrypt.compare(
      adminPassword,
      adminUser.passwordHash
    );
    if (!isPasswordValid) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect admin password");
    }

    // Step 3: Find the target user and verify access rights
    let targetUser;
    if ((role as unknown as string) === "SUPERADMIN") {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
      });
    } else {
      // Ensure target user belongs to the same restaurant
      targetUser = await prisma.user.findFirst({
        where: { id: targetUserId, restaurantId: restaurantId! },
      });
    }

    if (!targetUser) {
      throw new ApiError(httpStatus.NOT_FOUND, "Target user not found");
    }

    // Step 4: Hash the new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Step 5: Update the target user's password
    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash: newPasswordHash },
    });

    return { success: true };
  }
}
