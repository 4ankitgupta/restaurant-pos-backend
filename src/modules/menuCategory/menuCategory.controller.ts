import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as menuCategoryService from "./menuCategory.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

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

export const createMenuCategoryController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const newCategory = await menuCategoryService.createMenuCategory(
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          newCategory,
          "Category created successfully"
        )
      );
  }
);

export const updateMenuCategoryController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category ID is required");
    }

    const updatedCategory = await menuCategoryService.updateMenuCategory(
      categoryId,
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          updatedCategory,
          "Category updated successfully"
        )
      );
  }
);

export const deleteMenuCategoryController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { categoryId } = req.params;

    if (!categoryId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category ID is required");
    }

    await menuCategoryService.deleteMenuCategory(categoryId, restaurantId!);
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, {}, "Category deleted successfully")
      );
  }
);

export const reorderMenuCategoriesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { categoryIds } = req.body;

    if (!categoryIds || !Array.isArray(categoryIds)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "categoryIds array is required"
      );
    }

    const reorderedCategories = await menuCategoryService.reorderMenuCategories(
      categoryIds,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          reorderedCategories,
          "Categories reordered successfully"
        )
      );
  }
);
