import { z } from "zod";

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
    currentStock: z.number().optional(),
    reorderLevel: z.number().optional(),
  }),
});
