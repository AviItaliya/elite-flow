-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('SEVEN_DAYS', 'THREE_DAYS', 'ONE_DAY');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "SubscriptionReminder" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionReminder_status_idx" ON "SubscriptionReminder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionReminder_subscriptionId_type_key" ON "SubscriptionReminder"("subscriptionId", "type");

-- AddForeignKey
ALTER TABLE "SubscriptionReminder" ADD CONSTRAINT "SubscriptionReminder_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
