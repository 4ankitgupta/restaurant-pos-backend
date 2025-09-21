import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as orderService from "./order.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

export const createOrderController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const userId = req.user?.id;
    const order = await orderService.createOrder(
      req.body,
      restaurantId!,
      userId!
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          order,
          "Order created successfully."
        )
      );
  }
);
