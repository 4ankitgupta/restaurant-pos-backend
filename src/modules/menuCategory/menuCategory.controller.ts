import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as menuCategoryService from "./menuCategory.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

export const getAllMenuCategoriesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const menuCategories = await menuCategoryService.getAllMenuCategories(
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, menuCategories));
  }
);
