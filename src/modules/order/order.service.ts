import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export const createOrder = async (
  orderData: any,
  restaurantId: string,
  userId: string
) => {
  const { tableId, items } = orderData;

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((item: any) => item.menuItemId) },
      restaurantId,
    },
  });

  if (menuItems.length !== items.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "One or more menu items not found or do not belong to this restaurant."
    );
  }

  let totalAmount = 0;
  const orderItemsData = items.map((item: any) => {
    const menuItem = menuItems.find((mi) => mi.id === item.menuItemId);
    if (!menuItem) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Menu item with id ${item.menuItemId} not found.`
      );
    }
    totalAmount += Number(menuItem.price) * item.quantity;
    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: menuItem.price,
    };
  });

  const order = await prisma.order.create({
    data: {
      restaurantId,
      userId,
      tableId,
      totalAmount,
      orderItems: {
        create: orderItemsData,
      },
    },
    include: {
      orderItems: true,
    },
  });

  return order;
};
