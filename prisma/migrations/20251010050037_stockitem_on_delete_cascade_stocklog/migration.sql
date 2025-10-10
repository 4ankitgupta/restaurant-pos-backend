-- DropForeignKey
ALTER TABLE "public"."StockLog" DROP CONSTRAINT "StockLog_inventoryItemId_fkey";

-- AddForeignKey
ALTER TABLE "public"."StockLog" ADD CONSTRAINT "StockLog_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
