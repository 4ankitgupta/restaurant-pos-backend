import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import config from "../config/index.js";
import prisma from "../db/index.js";
import { UserRole } from "@prisma/client";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    restaurantId: string;
  };
}

export const authenticateJWT = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Access token is required");
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt.accessTokenSecret
      ) as jwt.JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, restaurantId: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Invalid access token or user is inactive"
        );
      }

      req.user = user;
      next();
    } catch (error) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid or expired access token"
      );
    }
  }
);

export const authorizeRoles = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to perform this action"
      );
    }
    next();
  };
};
