import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as cashierService from "./cashier.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import * as orderService from "../order/order.service.js";

export const getActiveAndUnpaidOrdersController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Restaurant not found for user"
      );
    }
    const orders = await cashierService.getActiveAndUnpaidOrders(restaurantId);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, orders));
  }
);

export const getCompletedOrdersController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Restaurant not found for user"
      );
    }
    const orders = await cashierService.getCompletedOrders(restaurantId);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, orders));
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

    const order = await cashierService.addItemsToOrder(
      orderId,
      items,
      restaurantId
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, order, "Items added successfully"));
  }
);

export const createTakeawayOrderController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const userId = req.user?.id;

    if (!restaurantId || !userId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User not found for this restaurant"
      );
    }

    const order = await cashierService.createTakeawayOrder(
      req.body,
      restaurantId,
      userId
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          order,
          "Takeaway order created successfully"
        )
      );
  }
);
