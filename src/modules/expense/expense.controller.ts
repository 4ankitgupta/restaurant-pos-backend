import { type Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as expenseService from "./expense.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";
import { ApiError } from "../../utils/ApiError.js";

// ================ EXPENSE CATEGORY CONTROLLERS ================

export const getAllExpenseCategoriesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const categories = await expenseService.getAllExpenseCategories(
      restaurantId!
    );
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, categories));
  }
);

export const getExpenseCategoryByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category ID is required");
    }
    const category = await expenseService.getExpenseCategoryById(
      id,
      restaurantId!
    );
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, category));
  }
);

export const createExpenseCategoryController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const newCategory = await expenseService.createExpenseCategory(
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

export const updateExpenseCategoryController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category ID is required");
    }
    const updatedCategory = await expenseService.updateExpenseCategory(
      id,
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

export const deleteExpenseCategoryController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Category ID is required");
    }
    await expenseService.deleteExpenseCategory(id, restaurantId!);
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, null, "Category deleted successfully")
      );
  }
);

// ================ EXPENSE CONTROLLERS ================

export const getAllExpensesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { startDate, endDate, categoryId, status, isRecurring } = req.query;

    const filters: any = {};
    if (startDate) filters.startDate = startDate as string;
    if (endDate) filters.endDate = endDate as string;
    if (categoryId) filters.categoryId = categoryId as string;
    if (status) filters.status = status as any;
    if (isRecurring !== undefined) {
      filters.isRecurring =
        isRecurring === "true"
          ? true
          : isRecurring === "false"
          ? false
          : undefined;
    }

    const expenses = await expenseService.getAllExpenses(
      restaurantId!,
      filters
    );

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, expenses));
  }
);

export const getExpenseByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Expense ID is required");
    }
    const expense = await expenseService.getExpenseById(id, restaurantId!);
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, expense));
  }
);

export const createExpenseController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const newExpense = await expenseService.createExpense(
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          newExpense,
          "Expense created successfully"
        )
      );
  }
);

export const updateExpenseController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Expense ID is required");
    }
    const updatedExpense = await expenseService.updateExpense(
      id,
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          updatedExpense,
          "Expense updated successfully"
        )
      );
  }
);

export const deleteExpenseController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Expense ID is required");
    }
    await expenseService.deleteExpense(id, restaurantId!);
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, null, "Expense deleted successfully")
      );
  }
);

// ================ RECURRING EXPENSE CONTROLLERS ================

export const getAllRecurringExpensesController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const recurringExpenses = await expenseService.getAllRecurringExpenses(
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, recurringExpenses));
  }
);

export const getRecurringExpenseByIdController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Recurring Expense ID is required"
      );
    }
    const recurringExpense = await expenseService.getRecurringExpenseById(
      id,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(new ApiResponse(httpStatus.OK, recurringExpense));
  }
);

export const createRecurringExpenseController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const newRecurringExpense = await expenseService.createRecurringExpense(
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.CREATED)
      .json(
        new ApiResponse(
          httpStatus.CREATED,
          newRecurringExpense,
          "Recurring expense created successfully"
        )
      );
  }
);

export const updateRecurringExpenseController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Recurring Expense ID is required"
      );
    }
    const updatedRecurringExpense = await expenseService.updateRecurringExpense(
      id,
      req.body,
      restaurantId!
    );
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          updatedRecurringExpense,
          "Recurring expense updated successfully"
        )
      );
  }
);

export const deleteRecurringExpenseController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId;
    if (!id) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Recurring Expense ID is required"
      );
    }
    await expenseService.deleteRecurringExpense(id, restaurantId!);
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(
          httpStatus.OK,
          null,
          "Recurring expense deleted successfully"
        )
      );
  }
);

// ================ ANALYTICS CONTROLLERS ================

export const getExpenseAnalyticsController = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user?.restaurantId;
    const { startDate, endDate } = req.query;

    const analytics = await expenseService.getExpenseAnalytics(
      restaurantId!,
      startDate as string,
      endDate as string
    );

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, analytics));
  }
);
