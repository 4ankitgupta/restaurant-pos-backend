import { z } from "zod";

const purchaseItemSchema = z.object({
  inventoryItemId: z.string().uuid(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplierId: z.string().uuid(),
    invoiceNumber: z.string().optional(),
    totalAmount: z.number().nonnegative(),
    purchaseDate: z.string().datetime().optional(),
    items: z.array(purchaseItemSchema).min(1, "At least one item is required"),
  }),
});

export type CreatePurchaseOrderDto = z.infer<
  typeof createPurchaseOrderSchema
>["body"];
