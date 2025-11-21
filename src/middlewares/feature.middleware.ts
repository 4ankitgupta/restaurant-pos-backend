import { type Response, type NextFunction } from "express";
import httpStatus from "http-status";
import { ApiError } from "../utils/ApiError.js";
import { type AuthRequest } from "./auth.middleware.js";
import prisma from "../db/index.js";
import { FEATURE_FLAGS } from "../constants.js";

/**
 * Middleware to check if a specific feature is enabled for the restaurant
 * @param featureKey - The key of the feature to check (e.g., "ai_chat", "inventory", "zomato_integration")
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
        select: {
          featureFlags: true,
          zomatoIntegrationEnabled: true,
        },
      });

      if (!restaurant) {
        throw new ApiError(httpStatus.NOT_FOUND, "Restaurant not found");
      }

      // Special handling for Zomato integration (boolean field)
      if (featureKey === FEATURE_FLAGS.ZOMATO_INTEGRATION) {
        if (!restaurant.zomatoIntegrationEnabled) {
          throw new ApiError(
            httpStatus.FORBIDDEN,
            `Zomato integration is not enabled for this restaurant.`
          );
        }
        next();
        return;
      }

      // Check JSON-based feature flags
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

/**
 * Helper function to check if a feature is enabled for a restaurant
 * @param restaurantId - The restaurant ID
 * @param featureKey - The feature flag key
 * @returns Promise<boolean> - Whether the feature is enabled
 */
export const isFeatureEnabled = async (
  restaurantId: string,
  featureKey: string
): Promise<boolean> => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      featureFlags: true,
      zomatoIntegrationEnabled: true,
    },
  });

  if (!restaurant) {
    return false;
  }

  // Special handling for Zomato integration
  if (featureKey === FEATURE_FLAGS.ZOMATO_INTEGRATION) {
    return restaurant.zomatoIntegrationEnabled;
  }

  const flags = restaurant.featureFlags as Record<string, boolean> | null;
  return flags?.[featureKey] === true;
};
