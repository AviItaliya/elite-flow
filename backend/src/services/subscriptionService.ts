import {createSubscription, findCompanySubscription, findPlanByIdForSubscription, findCompanySubscriptions, updateSubscriptionPlan, cancelSubscription, expireCompanySubscriptions} from "../repositories/subscriptionRepository.js";
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
  endDate.setDate(endDate.getDate() + plan.durationDays  );
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
  return expireCompanySubscriptions();
};
