/*
  Warnings:

  - Added the required column `updatedAt` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."OrderType" AS ENUM ('DINE_IN', 'TAKE_AWAY', 'DELIVERY_ZOMATO', 'DELIVERY_SWIGGY', 'DELIVERY_OTHER');

-- CreateEnum
CREATE TYPE "public"."ExpenseStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."RecurrenceInterval" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- AlterTable
ALTER TABLE "public"."Expense" ADD COLUMN     "attachmentUrl" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidBy" TEXT,
ADD COLUMN     "paymentMethod" "public"."PaymentMethod",
ADD COLUMN     "referenceNo" TEXT,
ADD COLUMN     "status" "public"."ExpenseStatus" NOT NULL DEFAULT 'PAID',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "expenseDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Order" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "deliveryAddress" TEXT,
ADD COLUMN     "orderType" "public"."OrderType" NOT NULL DEFAULT 'DINE_IN',
ADD COLUMN     "sourceId" TEXT;

-- AlterTable
ALTER TABLE "public"."Restaurant" ADD COLUMN     "zomatoIntegrationEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."ExpenseCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RecurringExpense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "interval" "public"."RecurrenceInterval" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextRunDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoGenerate" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "restaurantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ZomatoIntegration" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "apiKeyEncrypted" TEXT NOT NULL,
    "zomatoRestaurantId" TEXT NOT NULL,
    "webhookSecretEncrypted" TEXT,
    "isConfigured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ZomatoIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseCategory_restaurantId_name_key" ON "public"."ExpenseCategory"("restaurantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ZomatoIntegration_restaurantId_key" ON "public"."ZomatoIntegration"("restaurantId");

-- CreateIndex
CREATE INDEX "ZomatoIntegration_zomatoRestaurantId_idx" ON "public"."ZomatoIntegration"("zomatoRestaurantId");

-- CreateIndex
CREATE INDEX "Order_orderType_idx" ON "public"."Order"("orderType");

-- CreateIndex
CREATE INDEX "Order_restaurantId_sourceId_idx" ON "public"."Order"("restaurantId", "sourceId");

-- AddForeignKey
ALTER TABLE "public"."ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringExpense" ADD CONSTRAINT "RecurringExpense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RecurringExpense" ADD CONSTRAINT "RecurringExpense_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Expense" ADD CONSTRAINT "Expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ZomatoIntegration" ADD CONSTRAINT "ZomatoIntegration_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "public"."Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
