import prisma from "../../db/index.js";
import { StockChangeType } from "@prisma/client";
import { type CreateStockLogDto } from "./stockLog.validation.js";

export const createStockLog = async (
  data: CreateStockLogDto,
  restaurantId: string
) => {
  const { inventoryItemId, changeType, quantity, remarks } = data;

  return prisma.$transaction(async (tx) => {
    // 1. Create the stock log entry
    await tx.stockLog.create({
      data: {
        inventoryItemId,
        changeType,
        quantity,
        remarks,
        restaurantId,
      },
    });

    // 2. Determine the stock update operation
    let updateOperation;
    switch (changeType) {
      case StockChangeType.ADD:
        updateOperation = { increment: quantity };
        break;
      case StockChangeType.USAGE:
      case StockChangeType.REMOVE:
      case StockChangeType.WASTAGE:
        updateOperation = { decrement: quantity };
        break;
      case StockChangeType.ADJUST:
        // For ADJUST, we set the stock to the given quantity
        return tx.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { currentStock: quantity },
        });
      default:
        throw new Error("Invalid stock change type");
    }

    // 3. Update the inventory item's stock
    return tx.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        currentStock: updateOperation,
      },
    });
  });
};
