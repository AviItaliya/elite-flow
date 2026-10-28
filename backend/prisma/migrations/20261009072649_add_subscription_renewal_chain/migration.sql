/*
  Warnings:

  - A unique constraint covering the columns `[renewedFromSubscriptionId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "renewedFromSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_renewedFromSubscriptionId_key" ON "Subscription"("renewedFromSubscriptionId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_renewedFromSubscriptionId_fkey" FOREIGN KEY ("renewedFromSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
