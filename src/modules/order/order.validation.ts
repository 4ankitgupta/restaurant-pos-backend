import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const createOrderSchema = z.object({
  body: z.object({
    tableId: z.string().uuid().optional(),
    items: z
      .array(
        z.object({
          menuItemId: z.string().uuid(),
          quantity: z.number().int().positive(),
        })
      )
      .min(1),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(OrderStatus),
  }),
});
