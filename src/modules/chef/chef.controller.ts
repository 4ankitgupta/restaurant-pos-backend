// src/modules/chef/chef.controller.ts

import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as chefService from "./chef.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

export const getPreparingOrdersController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Restaurant not found");
    }

    const orders = await chefService.getPreparingOrders(restaurantId);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, orders));
  }
);

export const updateOrderStatusController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { orderId } = req.params;
    const { status } = req.body;

    if (!restaurantId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Restaurant not found");
    }
    if (!orderId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Order ID is required");
    }

    const updatedOrder = await chefService.updateOrderStatus(
      orderId,
      status,
      restaurantId
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, updatedOrder, "Order status updated")
      );
  }
);
