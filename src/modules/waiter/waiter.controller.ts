import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as waiterService from "./waiter.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

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

    const order = await waiterService.createOrder(
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

    const order = await waiterService.addItemsToOrder(
      orderId,
      items,
      restaurantId
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, order, "Items added successfully"));
  }
);

export const updateOrderItemStatusController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { orderItemId } = req.params;
    const { status } = req.body;

    if (!restaurantId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Restaurant not found");
    }
    if (!orderItemId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Order Item ID is required");
    }

    const updatedOrderItem = await waiterService.updateOrderItemStatus(
      orderItemId,
      status,
      restaurantId
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          updatedOrderItem,
          "Order item status updated"
        )
      );
  }
);

export const completeOrderController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { orderId } = req.params;

    if (!restaurantId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!orderId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Order ID is required");
    }

    const order = await waiterService.completeOrder(orderId, restaurantId);
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, order, "Order completed"));
  }
);
