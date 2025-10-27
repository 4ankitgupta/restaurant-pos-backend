import prisma from "../../db/index.js";
import { StockChangeType } from "@prisma/client";
import { type CreateStockLogDto } from "./stockLog.validation.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

export const createStockLog = async (
  data: CreateStockLogDto,
  restaurantId: string
) => {
  const { inventoryItemId, changeType, quantity, remarks } = data;

  return prisma.$transaction(async (tx) => {
    const itemToUpdate = await tx.inventoryItem.findFirst({
      where: { id: inventoryItemId, restaurantId },
    });

    if (!itemToUpdate) {
      throw new ApiError(httpStatus.NOT_FOUND, "Inventory item not found.");
    }

    // 1. Create the stock log entry
    await tx.stockLog.create({
      data: {
        inventoryItemId,
        changeType,
        quantity,
        remarks: remarks ?? null,
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
        if (itemToUpdate.currentStock < quantity) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Adjustment quantity cannot be greater than current stock."
          );
        }
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
