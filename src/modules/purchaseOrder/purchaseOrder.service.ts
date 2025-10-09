import prisma from "../../db/index.js";
import { type CreatePurchaseOrderDto } from "./purchaseOrder.validation.js";

export const createPurchaseOrder = async (
  data: CreatePurchaseOrderDto,
  restaurantId: string
) => {
  const { supplierId, items, ...orderData } = data;

  // Use a transaction to ensure all operations succeed or none do
  return prisma.$transaction(async (tx) => {
    // 1. Create the PurchaseOrder
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        ...orderData,
        restaurantId,
        supplierId,
        // Create PurchaseItem records nested within the PurchaseOrder
        purchaseItems: {
          create: items.map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            restaurantId, // Add restaurantId to each purchase item
          })),
        },
      },
    });

    // 2. Update the stock for each inventory item
    for (const item of items) {
      await tx.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: {
          currentStock: {
            increment: item.quantity,
          },
        },
      });
    }

    // 3. Return the newly created purchase order with its items
    return tx.purchaseOrder.findUnique({
      where: { id: purchaseOrder.id },
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
