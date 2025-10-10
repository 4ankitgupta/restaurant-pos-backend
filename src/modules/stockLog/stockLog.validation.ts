import { z } from "zod";
import { StockChangeType } from "@prisma/client";

export const createStockLogSchema = z.object({
  body: z.object({
    inventoryItemId: z.string().uuid(),
    changeType: z.nativeEnum(StockChangeType),
    quantity: z.number().nonnegative("Quantity must be a non-negative number"),
    remarks: z.string().optional(),
  }),
});

export type CreateStockLogDto = z.infer<typeof createStockLogSchema>["body"];
