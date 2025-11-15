import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import {
  PaymentStatus,
  TransactionStatus,
  OrderStatus,
  TableStatus,
} from "@prisma/client";
import { broadcastToRestaurant } from "../../websocketServer.js";

export const createPayment = async (paymentData: any, restaurantId: string) => {
  const { orderId, amount, paymentMethod } = paymentData;

  // Fetch order with tableId for table status update
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    select: { id: true, totalAmount: true, tableId: true },
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
  let orderStatus: OrderStatus | undefined;

  if (Number(totalPaid) >= Number(order.totalAmount)) {
    paymentStatus = PaymentStatus.PAID;
    // Always mark as COMPLETED if fully paid
    orderStatus = OrderStatus.COMPLETED;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus, ...(orderStatus && { status: orderStatus }) },
  });

  broadcastToRestaurant(restaurantId, {
    type: "PAYMENT_STATUS_UPDATE",
    payload: updatedOrder,
  });

  // Update Table Status if Order is Completed
  if (orderStatus === OrderStatus.COMPLETED && order.tableId) {
    const updatedTable = await prisma.table.update({
      where: { id: order.tableId },
      data: { status: TableStatus.Available },
    });
    broadcastToRestaurant(restaurantId, {
      type: "TABLE_UPDATE",
      payload: updatedTable,
    });
  }

  return payment;
};

export const refundPayment = async (orderId: string, restaurantId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { payments: true },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.paymentStatus !== PaymentStatus.PAID) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Order is not in a refundable state"
    );
  }

  await prisma.payment.updateMany({
    where: { orderId, restaurantId },
    data: { status: TransactionStatus.FAILED },
  });

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: PaymentStatus.REFUNDED },
  });

  broadcastToRestaurant(restaurantId, {
    type: "PAYMENT_STATUS_UPDATE",
    payload: updatedOrder,
  });

  return updatedOrder;
};
