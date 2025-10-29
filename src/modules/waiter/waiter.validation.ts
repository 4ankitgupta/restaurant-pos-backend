import { z } from "zod";
import { OrderItemStatus } from "@prisma/client";

// Define the schema for an item
const orderItemSchema = z.object({
  // menuItemId: z.string().uuid(), // <-- REMOVED
  menuItemVariantId: z.string().uuid(), // <-- ADDED
  quantity: z.number().int().positive(),
  note: z.string().optional(), // <-- ADDED
});

export const createOrderSchema = z.object({
  body: z.object({
    tableId: z.string().uuid(),
    items: z
      .array(orderItemSchema) // <-- Use the new item schema
      .optional(),
  }),
});

export const addItemsToOrderSchema = z.object({
  body: z.object({
    items: z
      .array(orderItemSchema) // <-- Use the new item schema
      .min(1),
  }),
  params: z.object({
    orderId: z.string().uuid(),
  }),
});

export const updateOrderItemStatusSchema = z.object({
  body: z.object({
    status: z.enum([OrderItemStatus.SERVED, OrderItemStatus.CANCELLED]),
  }),
  params: z.object({
    orderItemId: z.string().uuid(),
  }),
});

export const completeOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
});
