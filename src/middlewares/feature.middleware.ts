import { type Response, type NextFunction } from "express";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";
import { type AuthRequest } from "./auth.middleware.js";
import prisma from "../db/index.js";

/**
 * Middleware to check if a specific feature is enabled for the restaurant
 * @param featureKey - The key of the feature to check (e.g., "ai_chat", "inventory")
 */
export const requireFeature = (featureKey: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user || !user.restaurantId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
      }

      // Fetch fresh restaurant data to get latest flags
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: user.restaurantId },
        select: { featureFlags: true },
      });

      if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
      }

      const flags = restaurant.featureFlags as Record<string, boolean> | null;

      // Check if feature is explicitly enabled
      if (!flags || flags[featureKey] !== true) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          `Feature '${featureKey}' is not enabled for this restaurant.`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
