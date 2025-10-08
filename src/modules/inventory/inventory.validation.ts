import { z } from "zod";
import { StockChangeType } from "@prisma/client";

export const createInventoryItemSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    unit: z.string().min(1, "Unit is required"),
    currentStock: z.number().optional(),
    reorderLevel: z.number().optional(),
  }),
});

export const updateInventoryItemSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    unit: z.string().min(1, "Unit is required").optional(),
    reorderLevel: z.number().optional(),
  }),
});

export const adjustStockSchema = z.object({
  body: z.object({
    changeType: z.nativeEnum(StockChangeType),
    quantity: z.number().positive("Quantity must be a positive number"),
    remarks: z.string().optional(),
  }),
});
