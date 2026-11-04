import { prisma } from "../config/database.js";

interface RecordPaymentIntentFailureInput {
  paymentId: string;
  paymentIntentId: string;
  failureCode: string | null;
  failureMessage: string | null;
}

export const createPayment = async (data: {
  companyId: string;
  planId: string;
  amount: number;
  currency: string;
  purpose?: "NEW_SUBSCRIPTION" | "RENEWAL" | "PLAN_CHANGE";
  renewalForSubscriptionId?: string;
  planChangeForSubscriptionId?: string;
}) => {
  return prisma.payment.create({
    data: {
      companyId: data.companyId,
      planId: data.planId,
      amount: data.amount,
      currency: data.currency,
      purpose: data.purpose ?? "NEW_SUBSCRIPTION",
      renewalForSubscriptionId: data.renewalForSubscriptionId,
      planChangeForSubscriptionId: data.planChangeForSubscriptionId,
    },
  });
};

export const updatePaymentCheckoutSessionId = async (paymentId: string, sessionId: string) => {
  return prisma.payment.updateMany({
    where: {
      id: paymentId,
      stripeCheckoutSessionId: null,
      status: "PENDING",
    },
    data: {
      stripeCheckoutSessionId: sessionId,
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

export const findPaymentByCheckoutSessionIdForUpdate = async (sessionId: string) => {
  return prisma.payment.findUnique({
    where: {
      stripeCheckoutSessionId: sessionId,
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

export const updatePaymentSuccess = async (paymentId: string,
  data: {
    stripePaymentIntentId?: string;
    subscriptionId?: string;
    paidAt?: Date;
  }
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
  status: "FAILED" | "EXPIRED" | "REFUNDED"
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

export const markPaymentFailedBySessionId = async (sessionId: string) => {
  return prisma.payment.updateMany({
    where: {
      stripeCheckoutSessionId: sessionId,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
    },
  });
};

export const markPaymentExpiredBySessionId = async (sessionId: string) => {
  return prisma.payment.updateMany({
    where: {
      stripeCheckoutSessionId: sessionId,
      status: "PENDING",
    },
    data: {
      status: "EXPIRED",
    },
  });
};

export const markPaymentFailedById = async (paymentId: string) => {
  return prisma.payment.updateMany({
    where: {
      id: paymentId,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
    },
  });
};

export const markPaymentReviewRequired = async (paymentId: string, paymentIntentId?: string) => {
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

export const recordPaymentIntentFailure = async ({
  paymentId,
  paymentIntentId,
  failureCode,
  failureMessage,
}: RecordPaymentIntentFailureInput) => {
  return prisma.payment.updateMany({
    where: {
      id: paymentId,
      status: "PENDING",
      OR: [
        {
          stripePaymentIntentId: null,
        },
        {
          stripePaymentIntentId: paymentIntentId,
        },
      ],
    },
    data: {
      stripePaymentIntentId: paymentIntentId,
      paymentAttemptCount: {
        increment: 1,
      },
      lastFailureCode: failureCode,
      lastFailureMessage: failureMessage,
      lastFailureAt: new Date(),
    },
  });
};

// export const findPendingRenewalPayment = async (renewalForSubscriptionId: string) => {
//   return prisma.payment.findFirst({
//     where: {
//       renewalForSubscriptionId,
//       purpose: "RENEWAL",
//       status: {
//         in: ["PENDING", "REVIEW_REQUIRED"],
//       },
//     },
//     orderBy: {
//       createdAt: "desc",
//     },
//   });
// };

export const reserveRenewalPayment = async (data: {
  companyId: string;
  subscriptionId: string;
  planId: string;
  amount: number;
  currency: string;
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(
          ${`renewal:${data.subscriptionId}`},
          0
        )
      )
    `;

    const existingPayment = await tx.payment.findFirst({
      where: {
        companyId: data.companyId,
        renewalForSubscriptionId: data.subscriptionId,
        purpose: "RENEWAL",
        status: {
          in: ["PENDING", "REVIEW_REQUIRED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (existingPayment) {
      return existingPayment;
    }
    return tx.payment.create({
      data: {
        companyId: data.companyId,
        planId: data.planId,
        amount: data.amount,
        currency: data.currency,
        purpose: "RENEWAL",
        renewalForSubscriptionId: data.subscriptionId,
      },
    });
  });
};

export const reserveNewSubscriptionPayment = async (data: {
  companyId: string;
  planId: string;
  amount: number;
  currency: string;
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(
          ${`new_subscription:${data.companyId}`},
          0
        )
      )
    `;

    const existingPayment = await tx.payment.findFirst({
      where: {
        companyId: data.companyId,
        purpose: "NEW_SUBSCRIPTION",
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (existingPayment) {
      return existingPayment;
    }
    return tx.payment.create({
      data: {
        companyId: data.companyId,
        planId: data.planId,
        amount: data.amount,
        currency: data.currency,
        purpose: "NEW_SUBSCRIPTION",
      },
    });
  });
};

export const reservePlanChangePayment = async (data: {
  companyId: string;
  subscriptionId: string;
  planId: string;
  amount: number;
  currency: string;
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(
        hashtextextended(
          ${`plan_change:${data.subscriptionId}`},
          0
        )
      )
    `;
    const existingPayment = await tx.payment.findFirst({
      where: {
        companyId: data.companyId,
        planChangeForSubscriptionId: data.subscriptionId,
        purpose: "PLAN_CHANGE",
        status: {
          in: ["PENDING", "REVIEW_REQUIRED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    if (existingPayment) {
      return existingPayment;
    }
    return tx.payment.create({
      data: {
        companyId: data.companyId,
        planId: data.planId,
        amount: data.amount,
        currency: data.currency,
        purpose: "PLAN_CHANGE",
        planChangeForSubscriptionId: data.subscriptionId,
      },
    });
  });
};
