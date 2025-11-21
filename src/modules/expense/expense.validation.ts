import { z } from "zod";
import {
  ExpenseStatus,
  RecurrenceInterval,
  PaymentMethod,
} from "@prisma/client";

export const createExpenseCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
      .optional(),
  }),
});

export const updateExpenseCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Invalid color format")
      .optional(),
  }),
});

export const createExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1, "Description is required"),
    amount: z.number().positive("Amount must be positive"),
    expenseDate: z.string().datetime().optional(),
    status: z.nativeEnum(ExpenseStatus).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paidBy: z.string().optional(),
    referenceNo: z.string().optional(),
    attachmentUrl: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
    isRecurring: z.boolean().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1, "Description is required").optional(),
    amount: z.number().positive("Amount must be positive").optional(),
    expenseDate: z.string().datetime().optional(),
    status: z.nativeEnum(ExpenseStatus).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paidBy: z.string().optional(),
    referenceNo: z.string().optional(),
    attachmentUrl: z.string().url().optional(),
    categoryId: z.string().uuid().optional(),
  }),
});

export const createRecurringExpenseSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    amount: z.number().positive("Amount must be positive"),
    interval: z.nativeEnum(RecurrenceInterval),
    startDate: z.string().datetime(),
    isActive: z.boolean().optional(),
    autoGenerate: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
  }),
});

export const updateRecurringExpenseSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    amount: z.number().positive("Amount must be positive").optional(),
    interval: z.nativeEnum(RecurrenceInterval).optional(),
    startDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    autoGenerate: z.boolean().optional(),
    categoryId: z.string().uuid().optional(),
  }),
});

export const getExpensesQuerySchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    categoryId: z.string().uuid().optional(),
    status: z.nativeEnum(ExpenseStatus).optional(),
    isRecurring: z
      .string()
      .transform((val) => val === "true")
      .optional(),
  }),
});
