import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as inventoryService from "./inventory.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllInventoryItemsController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const inventoryItems = await inventoryService.getAllInventoryItems(
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, inventoryItems));
  }
);

export const getInventoryItemByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Inventory Item ID is required"
      );
    }
    const inventoryItem = await inventoryService.getInventoryItemById(
      id,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, inventoryItem));
  }
);

export const createInventoryItemController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const newInventoryItem = await inventoryService.createInventoryItem(
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          newInventoryItem,
          "Inventory item created successfully"
        )
      );
  }
);

export const updateInventoryItemController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Inventory Item ID is required"
      );
    }
    const updatedInventoryItem = await inventoryService.updateInventoryItem(
      id,
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          updatedInventoryItem,
          "Inventory item updated successfully"
        )
      );
  }
);

export const deleteInventoryItemController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Inventory Item ID is required"
      );
    }
    await inventoryService.deleteInventoryItem(id, restaurantId!);
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          {},
          "Inventory item deleted successfully"
        )
      );
  }
);
