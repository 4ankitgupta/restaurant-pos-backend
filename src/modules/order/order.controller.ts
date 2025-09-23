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

export const createOrderController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const userId = req.user?.id;
    const { tableId, items } = req.body;

    if (!restaurantId || !userId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User not found for this restaurant"
      );
    }

    const order = await orderService.createOrder(
      { tableId, items },
      restaurantId,
      userId
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(httpStatus.CREATED, order, "Order created successfully")
      );
  }
);

export const addItemsToOrderController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { orderId } = req.params;
    const { items } = req.body;

    if (!restaurantId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Restaurant not found for user"
      );
    }

    if (!orderId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Order ID is required");
    }

    const order = await orderService.addItemsToOrder(
      orderId,
      items,
      restaurantId
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, order, "Items added successfully"));
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
