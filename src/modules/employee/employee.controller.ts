import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import * as employeeService from "./employee.service.js";
import { ApiError } from "../../utils/ApiError.js";

export const createEmployeeController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;
    const employee = await employeeService.createEmployee(
      req.body,
      restaurantId
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          employee,
          "Employee created successfully"
        )
      );
  }
);

export const getAllEmployeesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;
    const employees = await employeeService.getAllEmployees(restaurantId);
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, employees, "Employees retrieved"));
  }
);

export const updateEmployeeController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Employee ID is required");
    }
    const restaurantId = req.user!.restaurantId;
    const employee = await employeeService.updateEmployee(
      id,
      req.body,
      restaurantId
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          employee,
          "Employee updated successfully"
        )
      );
  }
);
