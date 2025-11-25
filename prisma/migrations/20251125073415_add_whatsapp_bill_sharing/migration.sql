/*
  Warnings:

  - A unique constraint covering the columns `[billAccessToken]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "billAccessToken" TEXT,
ADD COLUMN     "billTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "whatsappSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsappSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."RestaurantMetaData" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT true,
    "whatsappProvider" TEXT NOT NULL DEFAULT 'PLATFORM',
    "messageCredits" INTEGER NOT NULL DEFAULT 100,
    "providerConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantMetaData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantMetaData_restaurantId_key" ON "public"."RestaurantMetaData"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_billAccessToken_key" ON "public"."Order"("billAccessToken");

-- AddForeignKey
ALTER TABLE "public"."RestaurantMetaData" ADD CONSTRAINT "RestaurantMetaData_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
