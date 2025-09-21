import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as tableService from "./table.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

export const getAllTablesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const tables = await tableService.getAllTables(restaurantId!);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, tables));
  }
);
