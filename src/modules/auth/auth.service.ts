import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import config from "../../config/index.js";

// Generate JWT Tokens
const generateTokens = (user: {
  id: string;
  role: UserRole;
  restaurantId: string;
}) => {
  // Use `any` to satisfy typings of jsonwebtoken in this project setup
  const accessToken = (jwt as any).sign(
    { id: user.id, role: user.role, restaurantId: user.restaurantId },
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpire }
  );

  const refreshToken = (jwt as any).sign(
    { id: user.id },
    config.jwt.refreshTokenSecret,
    { expiresIn: config.jwt.refreshTokenExpire }
  );

  return { accessToken, refreshToken };
};

// Register a new user
export const registerUser = async (userData: any) => {
  const { email, password, ...rest } = userData;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User with this email already exists"
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      ...rest,
      email,
      passwordHash,
    },
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
};

// Login user
export const loginUser = async (credentials: any) => {
  const { email, password } = credentials;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(httpStatus.FORBIDDEN, "User account is not active");
  }

  const tokens = generateTokens({
    id: user.id,
    role: user.role,
    restaurantId: user.restaurantId,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
    },
    tokens,
  };
};

// Update user
export const updateUser = async (
  userId: string,
  userData: any,
  restaurantId: string
) => {
  const user = await prisma.user.findFirst({
    where: { id: userId, restaurantId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: userData,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return updatedUser;
};

// Delete user
export const deleteUser = async (
  userId: string,
  restaurantId: string,
  invokingUser: { id: string }
) => {
  if (invokingUser.id === userId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Admin users cannot delete themselves."
    );
  }
  const user = await prisma.user.findFirst({
    where: { id: userId, restaurantId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  await prisma.user.delete({ where: { id: userId } });

  return { message: "User deleted successfully" };
};
