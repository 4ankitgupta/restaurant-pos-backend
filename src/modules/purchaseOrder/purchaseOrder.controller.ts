import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as purchaseOrderService from "./purchaseOrder.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

export const createPurchaseOrderController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const purchaseOrder = await purchaseOrderService.createPurchaseOrder(
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          purchaseOrder,
          "Purchase order created and stock updated."
        )
      );
  }
);

export const getAllPurchaseOrdersController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const purchaseOrders = await purchaseOrderService.getAllPurchaseOrders(
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, purchaseOrders));
  }
);
