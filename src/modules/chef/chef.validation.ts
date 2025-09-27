// src/modules/chef/chef.validation.ts

import { z } from "zod";
import { OrderItemStatus } from "@prisma/client";

export const updateOrderItemStatusSchema = z.object({
  body: z.object({
    status: z.enum([
      OrderItemStatus.PREPARING,
      OrderItemStatus.PREPARED,
      OrderItemStatus.CANCELLED,
    ]), // Chef can set status to PREPARED or CANCELLED
  }),
  params: z.object({
    orderItemId: z.string().uuid(),
  }),
});
