import { type Response, type NextFunction } from "express";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";
import type { AuthRequest } from "./auth.middleware.js";
import { UserRole } from "@prisma/client";

/**
 * This middleware enforces restaurant tenancy.
 * 1. It bypasses checks for SUPERADMIN.
 * 2. It ensures all other users have a restaurantId.
 * 3. On "create" requests (POST), it automatically injects the user's
 *    restaurantId into req.body to ensure new resources are correctly scoped.
 */
export const enforceTenancy = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // 1. If the user is SUPERADMIN, they can do anything.
  // Allow SUPERADMIN (if defined) to bypass tenancy checks. Compare as string
  // to avoid TypeScript errors in projects that don't define SUPERADMIN.
  if ((req.user?.role as unknown as string) === "SUPERADMIN") {
    return next();
  }

  // 2. All other users MUST be associated with a restaurant.
  const userRestaurantId = req.user?.restaurantId;
  if (!userRestaurantId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not associated with a restaurant."
    );
  }

  // 3. For POST requests, securely inject the user's restaurantId.
  if (req.method === "POST") {
    // Ensure body exists
    if (!req.body || typeof req.body !== "object") req.body = {} as any;
    req.body.restaurantId = userRestaurantId;
  }

  next();
};
