-- CreateEnum
CREATE TYPE "public"."OrderItemPaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- AlterTable
ALTER TABLE "public"."OrderItem" ADD COLUMN     "paymentStatus" "public"."OrderItemPaymentStatus" NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "public"."Payment" ADD COLUMN     "changeAmount" DECIMAL(65,30),
ADD COLUMN     "coveredItems" JSONB,
ADD COLUMN     "tenderedAmount" DECIMAL(65,30);
