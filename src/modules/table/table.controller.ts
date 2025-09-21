import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as tableService from "./table.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

export const getAllTablesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const tables = await tableService.getAllTables(restaurantId!);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, tables));
  }
);

export const allocateTableController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { tableId } = req.params;
    const { orderId, partySize } = req.body;

    if (!tableId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Table ID is required");
    }

    const table = await tableService.allocateTable(
      tableId,
      orderId,
      partySize,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, table, "Table allocated successfully")
      );
  }
);

export const updateTableStatusController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { tableId } = req.params;
    const { status } = req.body;

    if (!tableId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Table ID is required");
    }

    const table = await tableService.updateTableStatus(
      tableId,
      status,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          table,
          "Table status updated successfully"
        )
      );
  }
);
