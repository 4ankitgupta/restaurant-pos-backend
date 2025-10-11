import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as paymentService from "./payment.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

export const createPaymentController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const payment = await paymentService.createPayment(req.body, restaurantId!);
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          payment,
          "Payment created successfully."
        )
      );
  }
);

export const refundPaymentController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "User not found for this restaurant"
      );
    }

    if (!orderId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Order ID is required");
    }

    const refundedOrder = await paymentService.refundPayment(
      orderId,
      restaurantId
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          refundedOrder,
          "Order refunded successfully"
        )
      );
  }
);
