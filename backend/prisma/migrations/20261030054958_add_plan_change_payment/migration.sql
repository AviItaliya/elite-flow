-- AlterEnum
ALTER TYPE "PaymentPurpose" ADD VALUE 'PLAN_CHANGE';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "planChangeForSubscriptionId" TEXT;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planChangeForSubscriptionId_fkey" FOREIGN KEY ("planChangeForSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
