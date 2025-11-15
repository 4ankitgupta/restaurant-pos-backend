import prisma from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";
import {
  OrderStatus,
  OrderItemStatus,
  TableStatus,
  type MenuItemVariant,
} from "@prisma/client";
import { broadcastToRestaurant } from "../../websocketServer.js";

// Define the item type for validation
type OrderItemInput = {
  menuItemVariantId: string;
  quantity: number;
  note?: string;
};

export const createOrder = async (
  orderData: {
    tableId: string;
    items: Array<OrderItemInput>; // <-- Updated type
  },
  restaurantId: string,
  userId: string
) => {
  const { tableId, items } = orderData;

  return prisma.$transaction(async (tx) => {
    // 1. Fetch the menuItemVariants
    const variantIds = items.map((item) => item.menuItemVariantId);
    const menuVariants = await tx.menuItemVariant.findMany({
      where: {
        id: { in: variantIds },
        restaurantId,
      },
    });

    // 2. Validate all variants were found
    if (menuVariants.length !== variantIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "One or more menu item variants are invalid."
      );
    }

    // 3. Map variants for easy lookup and calculate total
    const variantsById = new Map(
      menuVariants.map((variant) => [variant.id, variant])
    );
    let totalAmount = 0;

    for (const item of items) {
      const variant = variantsById.get(item.menuItemVariantId);
      if (variant) {
        totalAmount =
          Number(totalAmount) + Number(variant.price) * item.quantity;
      }
    }

    // 4. Create the order
    const newOrder = await tx.order.create({
      data: {
        restaurantId,
        userId,
        tableId,
        totalAmount,
        status:
          items && items.length > 0
            ? OrderStatus.IN_PROGRESS
            : OrderStatus.PENDING,
        orderItems: {
          create: items.map((item) => {
            const variant = variantsById.get(item.menuItemVariantId);
            return {
              // Use connect for the relation instead of setting the ID directly
              menuItemVariant: {
                connect: { id: item.menuItemVariantId },
              },
              quantity: item.quantity,
              price: variant?.price || 0,
              note: item.note ?? null,
              status: OrderItemStatus.ORDERED,
              restaurant: {
                connect: { id: restaurantId },
              },
            };
          }),
        },
      },
      include: {
        orderItems: {
          include: {
            // Include the variant and its parent menu item
            menuItemVariant: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        table: true,
      },
    });

    // 5. UPDATE TABLE STATUS TO OCCUPIED
    const updatedTable = await tx.table.update({
      where: { id: tableId },
      data: { status: TableStatus.Occupied },
    });

    // Broadcast the new order
    broadcastToRestaurant(restaurantId, {
      type: "NEW_ORDER",
      payload: newOrder,
    });

    // Broadcast the table status update with current order status so UI can reflect it
    const tableUpdatePayload = {
      ...updatedTable,
      orderStatus: newOrder.status,
    } as typeof updatedTable & { orderStatus: OrderStatus };

    broadcastToRestaurant(restaurantId, {
      type: "TABLE_UPDATE",
      payload: tableUpdatePayload,
    });

    return newOrder;
  });
};

export const addItemsToOrder = async (
  orderId: string,
  items: Array<OrderItemInput>, // <-- Updated type
  restaurantId: string
) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, restaurantId },
    });

    if (!order) {
      throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
    }

    // 1. Fetch the menuItemVariants
    const variantIds = items.map((item) => item.menuItemVariantId);
    const menuVariants = await tx.menuItemVariant.findMany({
      where: {
        id: { in: variantIds },
        restaurantId,
      },
    });

    // 2. Validate all variants were found
    if (menuVariants.length !== variantIds.length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "One or more menu item variants are invalid."
      );
    }

    // 3. Map variants for easy lookup and prepare for creation
    const variantsById = new Map<string, MenuItemVariant>(
      menuVariants.map((variant) => [variant.id, variant])
    );
    let totalAmountToAdd = 0;

    const orderItemsToCreate = items.map((item) => {
      const variant = variantsById.get(item.menuItemVariantId);
      if (!variant) {
        // This case should not be hit due to the check above, but good for safety
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Variant mismatch"
        );
      }
      const itemTotal = Number(variant.price) * item.quantity;
      totalAmountToAdd += itemTotal;

      return {
        orderId,
        restaurantId,
        menuItemVariantId: item.menuItemVariantId, // <-- Use variant ID
        quantity: item.quantity,
        price: variant.price, // <-- Get price from variant
        note: item.note ?? null, // <-- Ensure null when undefined for createMany
        status: OrderItemStatus.ORDERED,
      };
    });

    // 4. Create all new order items
    await tx.orderItem.createMany({
      data: orderItemsToCreate,
    });

    // 5. Update the order total and status
    const newTotalAmount = Number(order.totalAmount) + totalAmountToAdd;
    let newStatus = order.status;
    if (order.status === OrderStatus.PENDING) {
      newStatus = OrderStatus.IN_PROGRESS;
    }

    const finalOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        totalAmount: newTotalAmount,
        status: newStatus,
      },
      include: {
        orderItems: {
          include: {
            menuItemVariant: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        table: true,
      },
    });

    broadcastToRestaurant(restaurantId, {
      type: "ORDER_ITEMS_UPDATED",
      payload: finalOrder,
    });

    // If status transitioned (e.g., PENDING -> IN_PROGRESS), inform table board with current order status
    const tableUpdatePayload = {
      ...finalOrder.table,
      orderStatus: finalOrder.status,
    } as typeof finalOrder.table & { orderStatus: OrderStatus };

    broadcastToRestaurant(restaurantId, {
      type: "TABLE_UPDATE",
      payload: tableUpdatePayload,
    });

    return finalOrder;
  });
};

export const updateOrderItemStatus = async (
  orderItemId: string,
  status: OrderItemStatus,
  restaurantId: string
) => {
  const orderItem = await prisma.orderItem.findFirst({
    where: { id: orderItemId, restaurantId },
  });

  if (!orderItem) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order item not found");
  }

  return await prisma.$transaction(async (tx) => {
    const updatedOrderItem = await tx.orderItem.update({
      where: { id: orderItemId },
      data: { status },
      include: {
        order: {
          include: {
            orderItems: {
              include: {
                menuItemVariant: {
                  include: {
                    menuItem: true,
                  },
                },
              },
            },
            table: true,
          },
        },
      },
    });

    // Recalculate order total excluding cancelled items
    const orderItems = updatedOrderItem.order.orderItems;
    const newTotalAmount = orderItems
      .filter((item) => item.status !== OrderItemStatus.CANCELLED)
      .reduce((sum, item) => {
        return sum + Number(item.price) * item.quantity;
      }, 0);

    // Update the order with the recalculated total
    await tx.order.update({
      where: { id: updatedOrderItem.orderId },
      data: { totalAmount: newTotalAmount },
    });

    // Update the order object with the new total for the broadcast
    updatedOrderItem.order.totalAmount = newTotalAmount as any;

    broadcastToRestaurant(restaurantId, {
      type: "ORDER_ITEM_STATUS_UPDATE",
      payload: updatedOrderItem,
    });

    return updatedOrderItem;
  });
};

export const completeOrder = async (orderId: string, restaurantId: string) => {
  const order = await prisma.order.findFirst({
    where: { id: orderId, restaurantId },
    include: { orderItems: true },
  });

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, "Order not found");
  }

  if (order.orderItems.length === 0) {
    // If there are no order items, the order can be cancelled
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
    broadcastToRestaurant(restaurantId, {
      type: "ORDER_STATUS_UPDATE",
      payload: updatedOrder,
    });
    return updatedOrder;
  }

  const allItemsServedOrCancelled = order.orderItems.every(
    (item) =>
      item.status === OrderItemStatus.SERVED ||
      item.status === OrderItemStatus.CANCELLED
  );

  if (!allItemsServedOrCancelled) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Not all items are served or cancelled."
    );
  }

  const allItemsCancelled = order.orderItems.every(
    (item) => item.status === OrderItemStatus.CANCELLED
  );

  const newStatus = allItemsCancelled
    ? OrderStatus.CANCELLED
    : OrderStatus.COMPLETED;

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });

  broadcastToRestaurant(restaurantId, {
    type: "ORDER_STATUS_UPDATE",
    payload: updatedOrder,
  });

  return updatedOrder;
};
