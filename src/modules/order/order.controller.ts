import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as orderService from "./order.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";
import { randomUUID } from "crypto";
import prisma from "../../db/index.js";
import { WhatsAppService } from "../../services/whatsapp/WhatsAppService.js";

export const getActiveOrdersController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    if (!restaurantId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Restaurant not found for user"
      );
    }
    const orders = await orderService.getActiveOrders(restaurantId!);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, orders));
  }
);

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

export const sendWhatsAppBill = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { orderId } = req.params;
    const { customerName, customerPhone } = req.body;
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    if (!orderId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Order ID is required");
    }

    // 1. Validation
    if (!customerPhone) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Phone number is required");
    }

    // 2. Verify order belongs to restaurant
    const existingOrder = await prisma.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!existingOrder) {
      throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    // 3. Update Customer Details on Order
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerName,
        customerPhone,
        // Generate Token if not exists
        billAccessToken: randomUUID(),
        billTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Days
      },
    });

    // 4. Construct Public Link
    // The frontend will route this to a page that fetches the PDF
    const publicLink = `${process.env.FRONTEND_URL}/view-bill/${order.billAccessToken}`;

    // 5. Call Service
    const whatsappService = new WhatsAppService();
    const result = await whatsappService.sendBill(
      restaurantId,
      orderId,
      customerPhone,
      publicLink
    );

    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, result, "Bill sent successfully"));
  }
);
