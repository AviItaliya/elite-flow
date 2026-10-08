import { prisma } from "../config/database.js";

export const createSubscription = async (data: {
  companyId: string;
  planId: string;
  status: "TRIAL" | "ACTIVE";
  startDate: Date;
  endDate: Date;
}) => {
  return prisma.subscription.create({
    data: {
      companyId: data.companyId,
      planId: data.planId,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
    },
    include: {
      plan: true,
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const findCompanySubscription = async (companyId: string) => {
  return prisma.subscription.findFirst({
    where: {
      companyId,
      status: {
        in: ["TRIAL", "ACTIVE"],
      },
      endDate: {
        gt: new Date(),
      },
    },
    include: {
      plan: true,
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findSubscriptionById = async (
  subscriptionId: string
) => {
  return prisma.subscription.findUnique({
    where: {
      id: subscriptionId,
    },
    include: {
      plan: true,
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};

export const findPlanByIdForSubscription = async (
  planId: string
) => {
  return prisma.plan.findUnique({
    where: {
      id: planId,
      isActive: true,
    },
  });
};

export const findCompanySubscriptions = async (
  companyId: string
) => {
  return prisma.subscription.findMany({
    where: {
      companyId,
    },
    include: {
      plan: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const updateSubscriptionPlan = async (
  subscriptionId: string,
  data: {
    planId: string;
    startDate: Date;
    endDate: Date;
    status: "ACTIVE";
  }
) => {
  return prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data,
    include: {
      plan: true,
    },
  });
};

export const cancelSubscription = async (
  subscriptionId: string
) => {
  return prisma.subscription.update({
    where: {
      id: subscriptionId,
    },
    data: {
      status: "CANCELLED",
    },
    include: {
      plan: true,
    },
  });
};

export const countCompanyUsers = async (
  companyId: string
) => {
  return prisma.user.count({
    where: {
      companyId,
      deletedAt: null,
    },
  });
};

export const expireCompanySubscriptions = async () => {
  return prisma.subscription.updateMany({
    where: {
      status: {
        in: ["TRIAL", "ACTIVE"],
      },
      endDate: {
        lte: new Date(),
      },
    },
    data: {
      status: "EXPIRED",
    },
  });
};