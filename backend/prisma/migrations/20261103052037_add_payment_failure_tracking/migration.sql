-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "lastFailureAt" TIMESTAMP(3),
ADD COLUMN     "lastFailureCode" TEXT,
ADD COLUMN     "lastFailureMessage" TEXT,
ADD COLUMN     "paymentAttemptCount" INTEGER NOT NULL DEFAULT 0;
