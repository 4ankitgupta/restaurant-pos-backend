import { z } from "zod";

// Define the schema for an item
const orderItemSchema = z.object({
  // menuItemId: z.string().uuid(), // <-- REMOVED
  menuItemVariantId: z.string().uuid(), // <-- ADDED
  quantity: z.number().int().positive(),
  note: z.string().optional(), // <-- ADDED
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

export const createTakeawayOrderSchema = z.object({
  body: z.object({
    items: z
      .array(orderItemSchema) // <-- Use the new item schema
      .min(1),
  }),
});
