import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  body: z.object({
    tableId: z.string().uuid(),
    items: z
      .array(
        z.object({
          menuItemId: z.string().uuid(),
          quantity: z.number().int().positive(),
        })
      )
      .optional(),
  }),
});

export const addItemsToOrderSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          menuItemId: z.string().uuid(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
  }),
  params: z.object({
    orderId: z.string().uuid(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
  params: z.object({
    orderId: z.string().uuid(),
  }),
});
