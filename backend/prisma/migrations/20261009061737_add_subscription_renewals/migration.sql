-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('NEW_SUBSCRIPTION', 'RENEWAL');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "trialUsedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "purpose" "PaymentPurpose" NOT NULL DEFAULT 'NEW_SUBSCRIPTION',
ADD COLUMN     "renewalForSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_renewalForSubscriptionId_idx" ON "Payment"("renewalForSubscriptionId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_renewalForSubscriptionId_fkey" FOREIGN KEY ("renewalForSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
