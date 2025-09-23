// src/modules/chef/chef.validation.ts

import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum([OrderStatus.PREPARED]), // Chef can only set status to PREPARED
  }),
  params: z.object({
    orderId: z.string().uuid(),
  }),
});
