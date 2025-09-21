import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as inventoryService from "./inventory.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

export const getAllInventoryItemsController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const inventoryItems = await inventoryService.getAllInventoryItems(
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, inventoryItems));
  }
);
