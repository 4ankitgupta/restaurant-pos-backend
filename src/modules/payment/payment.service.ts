import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import { PaymentStatus } from "@prisma/client";

export const createPayment = async (paymentData: any, restaurantId: string) => {
  const { orderId, amount, paymentMethod } = paymentData;

  const order = await prisma.order.findUnique({
    where: { id: orderId, restaurantId },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found.");
  }

  const payment = await prisma.payment.create({
    data: {
      orderId,
      restaurantId,
      amount,
      paymentMethod,
    },
  });

  const totalPaid =
    (
      await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { orderId },
      })
    )._sum.amount || 0;

  let paymentStatus: PaymentStatus = PaymentStatus.PARTIAL;
  if (totalPaid >= order.totalAmount) {
    paymentStatus = PaymentStatus.PAID;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus },
  });

  return payment;
};
