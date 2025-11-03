import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import * as attendanceService from "./attendance.service.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Endpoint for a device or Admin to create a punch.
 * This endpoint needs special auth (API Key) for hardware,
 * but for now we'll lock it to Admin/Manager.
 */
export const createPunchController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;
    if (!restaurantId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid authentication");
    }

    const punchResult = await attendanceService.createPunch(
      req.body,
      restaurantId
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          punchResult,
          "Punch recorded successfully"
        )
      );
  }
);

export const getDailyReportController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;
    const { date } = req.query;

    const targetDate = date ? new Date(date as string) : new Date();

    const report = await attendanceService.getDailyReport(
      restaurantId,
      targetDate
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, report, "Attendance report retrieved")
      );
  }
);
