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

export const createTableController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { tableNumber, capacity, status } = req.body;

    const table = await tableService.createTable(restaurantId!, {
      tableNumber,
      capacity,
      status,
    });

    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(httpStatus.CREATED, table, "Table created successfully")
      );
  }
);

export const updateTableController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { tableId } = req.params;

    if (!tableId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Table ID is required");
    }

    const { tableNumber, capacity, status } = req.body;

    const table = await tableService.updateTable(tableId, restaurantId!, {
      tableNumber,
      capacity,
      status,
    });

    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, table, "Table updated successfully")
      );
  }
);

export const deleteTableController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { tableId } = req.params;

    if (!tableId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Table ID is required");
    }

    const deletedTable = await tableService.deleteTable(tableId, restaurantId!);

    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          deletedTable,
          "Table deleted successfully"
        )
      );
  }
);

export const seatTableController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const userId = req.user?.id;
    const { tableId } = req.params;
    const { partySize } = req.body;

    if (!tableId) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Table ID is required");
    }

    const result = await tableService.seatTable(
      tableId,
      partySize,
      restaurantId!,
      userId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, result, "Table seated successfully")
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
