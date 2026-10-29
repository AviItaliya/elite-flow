import { prisma } from "../config/database.js";
import {createSubscription, findCompanySubscription, findPlanByIdForSubscription, findCompanySubscriptions, updateSubscriptionPlan,
  cancelSubscription, expireCompanySubscriptions, findCompanySubscriptionById} from "../repositories/subscriptionRepository.js";
  
export const createCompanySubscription = async (companyId: string, planId: string) => {
  const existingSubscription = await findCompanySubscription(companyId);
  if (existingSubscription) {
    throw new Error("Company already has an active subscription");
  }
  const plan = await findPlanByIdForSubscription(planId);
  if (!plan) {
    throw new Error("Plan not found or inactive");
  }
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);
  return createSubscription({
    companyId,
    planId: plan.id,
    status: "TRIAL",
    startDate,
    endDate,
  });
};

export const getCompanySubscription = async (companyId: string) => {
  const subscription = await findCompanySubscription(companyId);
  if (!subscription) {
    throw new Error("No active subscription found for this company");
  }
  return subscription;
};

export const getCompanySubscriptionHistory = async (companyId: string) => {
  return findCompanySubscriptions(companyId);
};

export const changeCompanyPlan = async (companyId: string, planId: string) => {
  const subscription = await findCompanySubscription(companyId);
  if (!subscription) {
    throw new Error("No active subscription found for this company");
  }
  const plan = await findPlanByIdForSubscription(planId);
  if (!plan) {
    throw new Error("Plan not found or inactive");
  }
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);
  return updateSubscriptionPlan(subscription.id, {
    planId: plan.id,
    startDate,
    endDate,
    status: "ACTIVE",
  });
};

export const cancelCompanySubscription = async (companyId: string) => {
  const subscription = await findCompanySubscription(companyId);
  if (!subscription) {
    throw new Error("No active subscription found for this company");
  }
  return cancelSubscription(subscription.id);
};

export const requireActiveSubscription = async (companyId: string) => {
  const subscription = await findCompanySubscription(companyId);
  if (!subscription) {
    throw new Error("Your company does not have an active subscription");
  }
  if (subscription.endDate <= new Date()) {
    throw new Error("Your company subscription has expired");
  }
  return subscription;
};

export const expireSubscriptions = async () => {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.subscription.updateMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] }, endDate: { lte: now } },
      data: { status: "EXPIRED" },
    });
    const companies = await tx.company.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    for (const company of companies) {
      const validSubscription = await tx.subscription.findFirst({
        where: {
          companyId: company.id,
          status: { in: ["ACTIVE", "TRIAL"] },
          startDate: { lte: now },
          endDate: { gt: now },
        },
        select: { id: true },
      });
      if (!validSubscription) {
        await tx.company.updateMany({
          where: { id: company.id, isSuspended: false },
          data: { isActive: false },
        });
      }
    }
  });
};

export const getSubscriptionRenewalEligibility = async (
  companyId: string,
  subscriptionId: string,
) => {
  const subscription = await findCompanySubscriptionById(
    subscriptionId,
    companyId,
  );
  if (!subscription) {
    throw new Error("Subscription not found for this company");
  }
  const now = new Date();
  const renewalOpensAt = new Date(subscription.endDate);
  renewalOpensAt.setDate(renewalOpensAt.getDate() - 7);
  if (subscription.startDate > now || subscription.endDate <= now) {
    return {
      eligible: false,
      reason: "This subscription is not currently active",
      subscription,
      renewalOpensAt,
    };
  }
  if (now < renewalOpensAt) {
    return {
      eligible: false,
      reason: "Renewal opens 7 days before the expiry date",
      subscription,
      renewalOpensAt,
    };
  }
  return {
    eligible: true,
    reason: null,
    subscription,
    renewalOpensAt,
  };
};
