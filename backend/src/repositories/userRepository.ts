import { prisma } from "../config/database.js";

export const findUserById = async (userId: string) => {
  return prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
    },
    include: {
      company: true,
    },
  });
};

export const findUserByIdAndCompany = async (
  userId: string,
  companyId: string
) => {
  return prisma.user.findFirst({
    where: {
      id: userId,
      companyId,
      deletedAt: null,
    },
    include: {
      company: true,
    },
  });
};

export const findUsersByCompany = async (
  companyId: string
) => {
  return prisma.user.findMany({
    where: {
      companyId,
      deletedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "USER";
  companyId: string;
}) => {
  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
      companyId: data.companyId,
      status: "ACTIVE",
      isVerified: false,
    },
  });
};

export const updateUser = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    role?: "ADMIN" | "USER";
    isVerified?: boolean;
  }
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data,
  });
};

export const updateUserStatus = async (
  userId: string,
  status: "ACTIVE" | "INACTIVE"
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status,
    },
  });
};

export const softDeleteUser = async (
  userId: string
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      deletedAt: new Date(),
      status: "INACTIVE",
    },
  });
};