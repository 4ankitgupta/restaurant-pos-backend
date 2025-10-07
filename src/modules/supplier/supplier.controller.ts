import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as supplierService from "./supplier.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllSuppliersController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const suppliers = await supplierService.getAllSuppliers(restaurantId!);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, suppliers));
  }
);

export const getSupplierByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    const supplier = await supplierService.getSupplierById(id, restaurantId!);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, supplier));
  }
);

export const createSupplierController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const newSupplier = await supplierService.createSupplier(
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          newSupplier,
          "Supplier created successfully"
        )
      );
  }
);

export const updateSupplierController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    const updatedSupplier = await supplierService.updateSupplier(
      id,
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          updatedSupplier,
          "Supplier updated successfully"
        )
      );
  }
);

export const deleteSupplierController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    await supplierService.deleteSupplier(id, restaurantId!);
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, {}, "Supplier deleted successfully")
      );
  }
);
