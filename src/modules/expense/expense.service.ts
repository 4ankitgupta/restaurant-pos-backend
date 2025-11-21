import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { ExpenseStatus, RecurrenceInterval, Prisma } from "@prisma/client";
import { addDays, addMonths, addYears, startOfDay, endOfDay } from "date-fns";

// ================ EXPENSE CATEGORY SERVICES ================

export const getAllExpenseCategories = async (restaurantId: string) => {
  return prisma.expenseCategory.findMany({
    where: { restaurantId },
    include: {
      _count: {
        select: { expenses: true, recurringRules: true },
      },
    },
    orderBy: { name: "asc" },
  });
};

export const getExpenseCategoryById = async (
  id: string,
  restaurantId: string
) => {
  const category = await prisma.expenseCategory.findFirst({
    where: { id, restaurantId },
    include: {
      _count: {
        select: { expenses: true, recurringRules: true },
      },
    },
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Expense category not found");
  }
  return category;
};

export const createExpenseCategory = async (
  categoryData: {
    name: string;
    description?: string;
    color?: string;
  },
  restaurantId: string
) => {
  // Check for duplicate name
  const existingCategory = await prisma.expenseCategory.findUnique({
    where: {
      restaurantId_name: {
        restaurantId,
        name: categoryData.name,
      },
    },
  });

  if (existingCategory) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Category with this name already exists"
    );
  }

  return prisma.expenseCategory.create({
    data: {
      ...categoryData,
      restaurantId,
    },
  });
};

export const updateExpenseCategory = async (
  id: string,
  categoryData: {
    name?: string;
    description?: string;
    color?: string;
  },
  restaurantId: string
) => {
  const category = await prisma.expenseCategory.findFirst({
    where: { id, restaurantId },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Expense category not found");
  }

  // Check for duplicate name if name is being updated
  if (categoryData.name && categoryData.name !== category.name) {
    const existingCategory = await prisma.expenseCategory.findUnique({
      where: {
        restaurantId_name: {
          restaurantId,
          name: categoryData.name,
        },
      },
    });

    if (existingCategory) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Category with this name already exists"
      );
    }
  }

  return prisma.expenseCategory.update({
    where: { id },
    data: categoryData,
  });
};

export const deleteExpenseCategory = async (
  id: string,
  restaurantId: string
) => {
  const category = await prisma.expenseCategory.findFirst({
    where: { id, restaurantId },
    include: {
      _count: {
        select: { expenses: true, recurringRules: true },
      },
    },
  });

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Expense category not found");
  }

  if (category._count.expenses > 0 || category._count.recurringRules > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot delete category with existing expenses or recurring rules"
    );
  }

  return prisma.expenseCategory.delete({ where: { id } });
};

// ================ EXPENSE SERVICES ================

export const getAllExpenses = async (
  restaurantId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    categoryId?: string;
    status?: ExpenseStatus;
    isRecurring?: boolean;
  }
) => {
  const where: Prisma.ExpenseWhereInput = { restaurantId };

  if (filters?.startDate || filters?.endDate) {
    where.expenseDate = {};
    if (filters.startDate) {
      where.expenseDate.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.expenseDate.lte = new Date(filters.endDate);
    }
  }

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.isRecurring !== undefined) {
    where.isRecurring = filters.isRecurring;
  }

  return prisma.expense.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: { expenseDate: "desc" },
  });
};

export const getExpenseById = async (id: string, restaurantId: string) => {
  const expense = await prisma.expense.findFirst({
    where: { id, restaurantId },
    include: {
      category: true,
    },
  });
  if (!expense) {
    throw new ApiError(httpStatus.NOT_FOUND, "Expense not found");
  }
  return expense;
};

export const createExpense = async (
  expenseData: {
    description: string;
    amount: number;
    expenseDate?: string;
    status?: ExpenseStatus;
    paymentMethod?: string;
    paidBy?: string;
    referenceNo?: string;
    attachmentUrl?: string;
    categoryId?: string;
    isRecurring?: boolean;
  },
  restaurantId: string
) => {
  // Validate category exists if provided
  if (expenseData.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: expenseData.categoryId, restaurantId },
    });
    if (!category) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category ID");
    }
  }

  const createData: any = {
    ...expenseData,
    expenseDate: expenseData.expenseDate
      ? new Date(expenseData.expenseDate)
      : new Date(),
    restaurantId,
  };

  return prisma.expense.create({
    data: createData,
    include: {
      category: true,
    },
  });
};

export const updateExpense = async (
  id: string,
  expenseData: {
    description?: string;
    amount?: number;
    expenseDate?: string;
    status?: ExpenseStatus;
    paymentMethod?: string;
    paidBy?: string;
    referenceNo?: string;
    attachmentUrl?: string;
    categoryId?: string;
  },
  restaurantId: string
) => {
  const expense = await prisma.expense.findFirst({
    where: { id, restaurantId },
  });

  if (!expense) {
    throw new ApiError(httpStatus.NOT_FOUND, "Expense not found");
  }

  // Validate category exists if provided
  if (expenseData.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: expenseData.categoryId, restaurantId },
    });
    if (!category) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category ID");
    }
  }

  const updateData: any = {
    ...expenseData,
  };

  if (expenseData.expenseDate) {
    updateData.expenseDate = new Date(expenseData.expenseDate);
  }

  return prisma.expense.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
    },
  });
};

export const deleteExpense = async (id: string, restaurantId: string) => {
  const expense = await prisma.expense.findFirst({
    where: { id, restaurantId },
  });

  if (!expense) {
    throw new ApiError(httpStatus.NOT_FOUND, "Expense not found");
  }

  return prisma.expense.delete({ where: { id } });
};

// ================ RECURRING EXPENSE SERVICES ================

export const getAllRecurringExpenses = async (restaurantId: string) => {
  return prisma.recurringExpense.findMany({
    where: { restaurantId },
    include: {
      category: true,
    },
    orderBy: { nextRunDate: "asc" },
  });
};

export const getRecurringExpenseById = async (
  id: string,
  restaurantId: string
) => {
  const recurringExpense = await prisma.recurringExpense.findFirst({
    where: { id, restaurantId },
    include: {
      category: true,
    },
  });
  if (!recurringExpense) {
    throw new ApiError(httpStatus.NOT_FOUND, "Recurring expense not found");
  }
  return recurringExpense;
};

const calculateNextRunDate = (
  startDate: Date,
  interval: RecurrenceInterval
): Date => {
  switch (interval) {
    case RecurrenceInterval.DAILY:
      return addDays(startDate, 1);
    case RecurrenceInterval.WEEKLY:
      return addDays(startDate, 7);
    case RecurrenceInterval.MONTHLY:
      return addMonths(startDate, 1);
    case RecurrenceInterval.QUARTERLY:
      return addMonths(startDate, 3);
    case RecurrenceInterval.YEARLY:
      return addYears(startDate, 1);
    default:
      return addMonths(startDate, 1);
  }
};

export const createRecurringExpense = async (
  recurringData: {
    name: string;
    amount: number;
    interval: RecurrenceInterval;
    startDate: string;
    isActive?: boolean;
    autoGenerate?: boolean;
    categoryId?: string;
  },
  restaurantId: string
) => {
  // Validate category exists if provided
  if (recurringData.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: recurringData.categoryId, restaurantId },
    });
    if (!category) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category ID");
    }
  }

  const startDate = new Date(recurringData.startDate);
  const nextRunDate = calculateNextRunDate(startDate, recurringData.interval);

  return prisma.recurringExpense.create({
    data: {
      ...recurringData,
      startDate,
      nextRunDate,
      restaurantId,
    },
    include: {
      category: true,
    },
  });
};

export const updateRecurringExpense = async (
  id: string,
  recurringData: {
    name?: string;
    amount?: number;
    interval?: RecurrenceInterval;
    startDate?: string;
    isActive?: boolean;
    autoGenerate?: boolean;
    categoryId?: string;
  },
  restaurantId: string
) => {
  const recurringExpense = await prisma.recurringExpense.findFirst({
    where: { id, restaurantId },
  });

  if (!recurringExpense) {
    throw new ApiError(httpStatus.NOT_FOUND, "Recurring expense not found");
  }

  // Validate category exists if provided
  if (recurringData.categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: { id: recurringData.categoryId, restaurantId },
    });
    if (!category) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid category ID");
    }
  }

  // Recalculate nextRunDate if interval or startDate changed
  let nextRunDate = undefined;
  if (recurringData.interval || recurringData.startDate) {
    const newStartDate = recurringData.startDate
      ? new Date(recurringData.startDate)
      : recurringExpense.startDate;
    const newInterval = recurringData.interval || recurringExpense.interval;
    nextRunDate = calculateNextRunDate(newStartDate, newInterval);
  }

  const updateData: any = {
    ...recurringData,
  };

  if (recurringData.startDate) {
    updateData.startDate = new Date(recurringData.startDate);
  }

  if (nextRunDate) {
    updateData.nextRunDate = nextRunDate;
  }

  return prisma.recurringExpense.update({
    where: { id },
    data: updateData,
    include: {
      category: true,
    },
  });
};

export const deleteRecurringExpense = async (
  id: string,
  restaurantId: string
) => {
  const recurringExpense = await prisma.recurringExpense.findFirst({
    where: { id, restaurantId },
  });

  if (!recurringExpense) {
    throw new ApiError(httpStatus.NOT_FOUND, "Recurring expense not found");
  }

  return prisma.recurringExpense.delete({ where: { id } });
};

// ================ ANALYTICS SERVICES ================

export const getExpenseAnalytics = async (
  restaurantId: string,
  startDate?: string,
  endDate?: string
) => {
  const where: Prisma.ExpenseWhereInput = { restaurantId };

  if (startDate || endDate) {
    where.expenseDate = {};
    if (startDate) {
      where.expenseDate.gte = new Date(startDate);
    }
    if (endDate) {
      where.expenseDate.lte = new Date(endDate);
    }
  }

  // Total expenses
  const totalExpenses = await prisma.expense.aggregate({
    where,
    _sum: {
      amount: true,
    },
  });

  // Expenses by status
  const expensesByStatus = await prisma.expense.groupBy({
    by: ["status"],
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  // Expenses by category
  const expensesByCategory = await prisma.expense.groupBy({
    by: ["categoryId"],
    where,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
  });

  // Get category details
  const categoryIds = expensesByCategory
    .map((e) => e.categoryId)
    .filter((id): id is string => id !== null);

  const categories = await prisma.expenseCategory.findMany({
    where: {
      id: { in: categoryIds },
    },
  });

  const expensesByCategoryWithDetails = expensesByCategory.map((expense) => {
    const category = categories.find((c) => c.id === expense.categoryId);
    return {
      categoryId: expense.categoryId,
      categoryName: category?.name || "Uncategorized",
      categoryColor: category?.color || "#6B7280",
      totalAmount: expense._sum.amount || 0,
      count: expense._count.id,
    };
  });

  // Pending bills count
  const pendingBills = await prisma.expense.count({
    where: {
      ...where,
      status: ExpenseStatus.PENDING,
    },
  });

  // Overdue bills count
  const overdueBills = await prisma.expense.count({
    where: {
      ...where,
      status: ExpenseStatus.OVERDUE,
    },
  });

  // Largest category
  const largestCategory = expensesByCategoryWithDetails.sort(
    (a, b) => Number(b.totalAmount) - Number(a.totalAmount)
  )[0];

  return {
    totalExpenses: totalExpenses._sum.amount || 0,
    pendingBills,
    overdueBills,
    expensesByStatus,
    expensesByCategory: expensesByCategoryWithDetails,
    largestCategory: largestCategory || null,
  };
};

// ================ RECURRING AUTOMATION ================

export const processRecurringExpenses = async () => {
  const now = new Date();

  // Find all active recurring expenses due for generation
  const dueRecurringExpenses = await prisma.recurringExpense.findMany({
    where: {
      isActive: true,
      autoGenerate: true,
      nextRunDate: {
        lte: now,
      },
    },
    include: {
      category: true,
      restaurant: true,
    },
  });

  console.log(
    `[Recurring Expenses] Found ${dueRecurringExpenses.length} recurring expenses to process`
  );

  const results = [];

  for (const recurring of dueRecurringExpenses) {
    try {
      // Create the expense
      const expense = await prisma.expense.create({
        data: {
          description: `${recurring.name} (Auto-generated)`,
          amount: recurring.amount,
          expenseDate: recurring.nextRunDate,
          status: ExpenseStatus.PENDING,
          categoryId: recurring.categoryId,
          isRecurring: true,
          restaurantId: recurring.restaurantId,
        },
      });

      // Update the next run date
      const nextRunDate = calculateNextRunDate(
        recurring.nextRunDate,
        recurring.interval
      );

      await prisma.recurringExpense.update({
        where: { id: recurring.id },
        data: { nextRunDate },
      });

      results.push({
        success: true,
        recurringId: recurring.id,
        expenseId: expense.id,
        nextRunDate,
      });

      console.log(
        `[Recurring Expenses] Generated expense ${expense.id} for ${recurring.name} (Restaurant: ${recurring.restaurant.name})`
      );
    } catch (error) {
      console.error(
        `[Recurring Expenses] Error processing recurring expense ${recurring.id}:`,
        error
      );
      results.push({
        success: false,
        recurringId: recurring.id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
};

// ================ MARK OVERDUE EXPENSES ================

export const markOverdueExpenses = async () => {
  const now = new Date();

  const result = await prisma.expense.updateMany({
    where: {
      status: ExpenseStatus.PENDING,
      expenseDate: {
        lt: now,
      },
    },
    data: {
      status: ExpenseStatus.OVERDUE,
    },
  });

  console.log(`[Expenses] Marked ${result.count} expenses as overdue`);
  return result;
};
