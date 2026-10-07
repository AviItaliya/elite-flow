import { prisma } from "../config/database.js";

export const findCompanyById = async (companyId: string) => {
  return prisma.company.findUnique({
    where: {
      id: companyId,
    },
  });
};

export const findCompanyByEmail = async (email: string) => {
  return prisma.company.findUnique({
    where: {
      email,
    },
  });
};

export const updateCompany = async (
  companyId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }
) => {
  return prisma.company.update({
    where: {
      id: companyId,
    },
    data,
  });
};