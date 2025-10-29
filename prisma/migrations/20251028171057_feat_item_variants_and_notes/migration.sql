/*
  Warnings:

  - You are about to drop the column `price` on the `MenuItem` table. All the data in the column will be lost.
  - You are about to drop the column `menuItemId` on the `OrderItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_menuItemId_fkey";

-- AlterTable
ALTER TABLE "public"."MenuItem" DROP COLUMN "price";

-- AlterTable
ALTER TABLE "public"."OrderItem" DROP COLUMN "menuItemId",
ADD COLUMN     "menuItemVariantId" TEXT,
ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "public"."MenuItemVariant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,

    CONSTRAINT "MenuItemVariant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MenuItemVariant" ADD CONSTRAINT "MenuItemVariant_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "public"."MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MenuItemVariant" ADD CONSTRAINT "MenuItemVariant_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_menuItemVariantId_fkey" FOREIGN KEY ("menuItemVariantId") REFERENCES "public"."MenuItemVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
