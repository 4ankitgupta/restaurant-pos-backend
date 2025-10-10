-- AlterEnum
ALTER TYPE "public"."StockChangeType" ADD VALUE 'USAGE';

-- AlterTable
ALTER TABLE "public"."StockLog" ADD COLUMN     "purchaseOrderId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."StockLog" ADD CONSTRAINT "StockLog_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
