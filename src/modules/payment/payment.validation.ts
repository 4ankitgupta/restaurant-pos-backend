import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const createPaymentSchema = z.object({
  body: z.object({
    orderId: z.string().uuid(),
    amount: z.coerce.number().positive(),
    paymentMethod: z.nativeEnum(PaymentMethod),
  }),
});

export const refundPaymentSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
});
