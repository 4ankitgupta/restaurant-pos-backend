import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as orderService from "./order.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

export const getActiveOrderByTableController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { tableId } = req.params;
    if (!restaurantId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Restaurant not found for user"
      );
    }
    if (!tableId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Table ID is required");
    }
    const order = await orderService.getActiveOrderByTable(
      tableId,
      restaurantId!
    );
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, order));
  }
);

export const getOrderDetailsController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { orderId } = req.params;

    if (!restaurantId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Restaurant not found for user"
      );
    }
    if (!orderId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Order ID is required");
    }

    const order = await orderService.getOrderDetails(orderId, restaurantId);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, order));
  }
);

export const getAllOrdersController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const orders = await orderService.getAllOrders(restaurantId);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, orders));
  }
);
