import { prisma } from "../config/database.js";

export const createPlan = async (data: {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  maxUsers: number;
  maxProjects: number;
}) => {
  return prisma.plan.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      durationDays: data.durationDays,
      maxUsers: data.maxUsers,
      maxProjects: data.maxProjects,
    },
  });
};

export const findAllPlans = async () => {
  return prisma.plan.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      price: "asc",
    },
  });
};

export const findPlanById = async (planId: string) => {
  return prisma.plan.findUnique({
    where: {
      id: planId,
    },
  });
};

export const findPlanByName = async (name: string) => {
  return prisma.plan.findUnique({
    where: {
      name,
    },
  });
};

export const updatePlan = async (
  planId: string,
  data: {
    name?: string;
    description?: string;
    price?: number;
    durationDays?: number;
    maxUsers?: number;
    maxProjects?: number;
  }
) => {
  return prisma.plan.update({
    where: {
      id: planId,
    },
    data,
  });
};

export const updatePlanStatus = async (
  planId: string,
  isActive: boolean
) => {
  return prisma.plan.update({
    where: {
      id: planId,
    },
    data: {
      isActive,
    },
  });
};

export const findActivePlanById = async (
  planId: string
) => {
  return prisma.plan.findFirst({
    where: {
      id: planId,
      isActive: true,
    },
  });
};