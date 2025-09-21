import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as paymentService from "./payment.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

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
