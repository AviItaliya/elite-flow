import { prisma } from "../config/database.js";

export const createPayment = async (data: {
  companyId: string;
  planId: string;
  stripeCheckoutSessionId: string;
  amount: number;
  currency: string;
  purpose?: "NEW_SUBSCRIPTION" | "RENEWAL";
  renewalForSubscriptionId?: string;
}) => {
  return prisma.payment.create({
    data: {
      companyId: data.companyId,
      planId: data.planId,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId,
      amount: data.amount,
      currency: data.currency,
      purpose: data.purpose ?? "NEW_SUBSCRIPTION",
      renewalForSubscriptionId: data.renewalForSubscriptionId,
    },
  });
};

export const markPaymentReviewRequired = async (
  paymentId: string,
  paymentIntentId?: string
) => {
  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: "REVIEW_REQUIRED",
      ...(paymentIntentId && {
        stripePaymentIntentId: paymentIntentId,
      }),
    },
  });
};

export const findPaymentByCheckoutSessionId = async (sessionId: string) => {
  return prisma.payment.findUnique({
    where: {
      stripeCheckoutSessionId: sessionId,
    },
    include: {
      company: true,
      plan: true,
      subscription: true,
    },
  });
};

export const findPaymentByPaymentIntentId = async (paymentIntentId: string) => {
  return prisma.payment.findUnique({
    where: {
      stripePaymentIntentId: paymentIntentId,
    },
    include: {
      company: true,
      plan: true,
      subscription: true,
    },
  });
};

export const updatePaymentSuccess = async (
  paymentId: string,
  data: {
    stripePaymentIntentId?: string;
    subscriptionId?: string;
    paidAt?: Date;
  },
) => {
  return prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      stripePaymentIntentId: data.stripePaymentIntentId,
      subscriptionId: data.subscriptionId,
      paidAt: data.paidAt,
      status: "SUCCESS",
    },
  });
};

export const updatePaymentStatus = async (
  paymentId: string,
  status: "FAILED" | "EXPIRED" | "REFUNDED",
) => {
  return prisma.payment.update({
    where: {
      id: paymentId,
    },
    data: {
      status,
    },
  });
};

export const findCompanyPayments = async (companyId: string) => {
  return prisma.payment.findMany({
    where: {
      companyId,
    },
    include: {
      plan: true,
      subscription: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findPaymentByCheckoutSessionIdForUpdate = async (
  sessionId: string,
) => {
  return prisma.payment.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
  });
};

export const markPaymentFailedBySessionId = async (sessionId: string) => {
  return prisma.payment.updateMany({
    where: { stripeCheckoutSessionId: sessionId, status: "PENDING" },
    data: { status: "FAILED" },
  });
};

export const markPaymentExpiredBySessionId = async (sessionId: string) => {
  return prisma.payment.updateMany({
    where: { stripeCheckoutSessionId: sessionId, status: "PENDING" },
    data: { status: "EXPIRED" },
  });
};


export const findPendingRenewalPayment = async (renewalForSubscriptionId: string) =>
  prisma.payment.findFirst({
    where: {
      renewalForSubscriptionId,
      purpose: "RENEWAL",
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  export const markPendingPaymentReviewRequired = async (paymentId: string, paymentIntentId?: string) => {
  return prisma.payment.updateMany({
    where: {
      id: paymentId,
      status: "PENDING",
    },
    data: {
      status: "REVIEW_REQUIRED",
      ...(paymentIntentId && {
        stripePaymentIntentId: paymentIntentId,
      }),
    },
  });
};

export const findReviewRequiredPaymentById = async (paymentId: string) => {
  return prisma.payment.findFirst({
    where: {
      id: paymentId,
      status: "REVIEW_REQUIRED",
    },
    include: {
      company: true,
      plan: true,
      subscription: true,
    },
  });
};

export const claimReviewRequiredPayment = async (paymentId: string) => {
  return prisma.payment.updateMany({
    where: {
      id: paymentId,
      status: "REVIEW_REQUIRED",
    },
    data: {
      status: "PENDING",
    },
  });
};

export const findPaymentById = async (paymentId: string) => {
  return prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      company: true,
      plan: true,
      subscription: true,
    },
  });
};