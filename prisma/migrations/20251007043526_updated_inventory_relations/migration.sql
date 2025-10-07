/*
  Warnings:

  - You are about to drop the column `quantity` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `threshold` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `InventoryItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to alter the column `quantity` on the `PurchaseItem` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - You are about to drop the column `status` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to alter the column `totalAmount` on the `PurchaseOrder` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `DoublePrecision`.
  - Added the required column `lastUpdated` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPrice` to the `PurchaseItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `PurchaseItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `quantity` on table `PurchaseItem` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalAmount` on table `PurchaseOrder` required. This step will fail if there are existing NULL values in that column.
  - Made the column `supplierId` on table `PurchaseOrder` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."StockChangeType" AS ENUM ('ADD', 'REMOVE', 'ADJUST', 'WASTAGE');

-- DropForeignKey
ALTER TABLE "public"."PurchaseItem" DROP CONSTRAINT "PurchaseItem_purchaseOrderId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_supplierId_fkey";

-- AlterTable
ALTER TABLE "public"."InventoryItem" DROP COLUMN "quantity",
DROP COLUMN "threshold",
DROP COLUMN "updatedAt",
ADD COLUMN     "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lastUpdated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "reorderLevel" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."PurchaseItem" DROP COLUMN "price",
ADD COLUMN     "totalPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "quantity" SET NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."PurchaseOrder" DROP COLUMN "status",
ADD COLUMN     "invoiceNumber" TEXT,
ADD COLUMN     "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "totalAmount" SET NOT NULL,
ALTER COLUMN "totalAmount" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "supplierId" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Supplier" ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "public"."PurchaseStatus";

-- CreateTable
CREATE TABLE "public"."StockLog" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "changeType" "public"."StockChangeType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "public"."Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "public"."PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLog" ADD CONSTRAINT "StockLog_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockLog" ADD CONSTRAINT "StockLog_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "public"."InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
