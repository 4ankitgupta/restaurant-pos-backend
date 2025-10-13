import httpStatus from "http-status";
import { type Request, type Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as dashboardService from "./dashboard.service.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

export const getManagerDashboardData = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;
    const data = await dashboardService.getManagerDashboardStats(restaurantId);

    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          data,
          "Manager dashboard data retrieved successfully"
        )
      );
  }
);

export const getAdminDashboardData = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;
    const data = await dashboardService.getAdminDashboardStats(restaurantId);

    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          data,
          "Admin dashboard data retrieved successfully"
        )
      );
  }
);
