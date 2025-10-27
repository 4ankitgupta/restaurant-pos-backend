import prisma from "../../db/index.js";
import { type CreatePurchaseOrderDto } from "./purchaseOrder.validation.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export const createPurchaseOrder = async (
  data: CreatePurchaseOrderDto,
  restaurantId: string
) => {
  const { supplierId, items, ...orderData } = data;

  // Use a transaction to ensure all operations succeed or none do
  return prisma.$transaction(async (tx) => {
    // 1. Create the PurchaseOrder
    const purchaseData: any = {
      restaurantId,
      supplierId,
      totalAmount: orderData.totalAmount,
      invoiceNumber: (orderData as any).invoiceNumber ?? null,
      purchaseItems: {
        create: items.map((item) => ({
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          restaurantId, // Add restaurantId to each purchase item
        })),
      },
    };

    if ((orderData as any).purchaseDate) {
      purchaseData.purchaseDate = new Date((orderData as any).purchaseDate);
    }

    const purchaseOrder = await tx.purchaseOrder.create({
      data: purchaseData,
    });

    // 2. Update the stock for each inventory item (verify tenancy)
    for (const item of items) {
      const inventory = await tx.inventoryItem.findFirst({
        where: { id: item.inventoryItemId, restaurantId },
      });

      if (!inventory) {
        throw new ApiError(httpStatus.NOT_FOUND, "Inventory item not found");
      }

      await tx.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          currentStock: {
            increment: item.quantity,
          },
        },
      });
    }

    // 3. Return the newly created purchase order with its items (scoped to restaurant)
    return tx.purchaseOrder.findFirst({
      where: { id: purchaseOrder.id, restaurantId },
      include: {
        purchaseItems: {
          include: {
            inventoryItem: true,
          },
        },
        supplier: true,
      },
    });
  });
};

export const getAllPurchaseOrders = (restaurantId: string) => {
  return prisma.purchaseOrder.findMany({
    where: { restaurantId },
    include: {
      supplier: true,
      purchaseItems: {
        include: {
          inventoryItem: true,
        },
      },
    },
    orderBy: {
      purchaseDate: "desc",
    },
  });
};
