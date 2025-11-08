/*
  Warnings:

  - A unique constraint covering the columns `[restaurantId,biometricId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Employee_biometricId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Employee_restaurantId_biometricId_key" ON "public"."Employee"("restaurantId", "biometricId");
