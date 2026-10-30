-- CreateEnum
CREATE TYPE "UserDeactivationReason" AS ENUM ('SUBSCRIPTION_EXPIRED', 'MANUAL', 'COMPANY_SUSPENDED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deactivationReason" "UserDeactivationReason";
