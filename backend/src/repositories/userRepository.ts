import { prisma } from "../config/database.js";

export type CompanyUserRole = "ADMIN" | "USER";
export type CompanyUserStatus = "ACTIVE" | "INACTIVE";
export type UserSortField = "createdAt" | "updatedAt" | "name" | "email";
export type UserSortOrder = "asc" | "desc";

export interface UserListFilters {
  page: number;
  limit: number;
  search?: string;
  role?: CompanyUserRole;
  status?: CompanyUserStatus;
  sortBy: UserSortField;
  sortOrder: UserSortOrder;
}

export const findSuperadmin = async () => {
  return prisma.user.findFirst({
    where: {
      role: "SUPERADMIN",
      deletedAt: null,
    },
  });
};

export const createSuperadmin = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(8347291)::text
    `;

    const existingSuperadmin = await tx.user.findFirst({
      where: {
        role: "SUPERADMIN",
        deletedAt: null,
      },
    });
    if (existingSuperadmin) {
      throw new Error("Superadmin already exists");
    }
    return tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "SUPERADMIN",
        companyId: null,
        status: "ACTIVE",
        isVerified: true,
      },
    });
  });
};

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

export const findUserByIdAndCompany = async (userId: string, companyId: string) => {
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

export const findUsersByCompany = async (companyId: string, filters: UserListFilters) => {
  const {page, limit, search, role, status, sortBy, sortOrder} = filters;
  const where = {
    companyId,
    deletedAt: null,
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };
  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: {[sortBy]: sortOrder},
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        companyId: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.user.count({
      where,
    }),
  ]);
  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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

export const updateUserStatus = async (userId: string, status: "ACTIVE" | "INACTIVE") => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      status,
    },
  });
};

export const softDeleteUser = async (userId: string) => {
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

export const countCompanyUsers = async (companyId: string) => {
  return prisma.user.count({
    where: {
      companyId,
      deletedAt: null,
    },
  });
};

export const updateUserProfileImage = async (userId: string, profileImageUrl: string, profileImagePublicId: string) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profileImageUrl,
      profileImagePublicId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImageUrl: true,
      profileImagePublicId: true,
      updatedAt: true,
    },
  });
};

export const clearUserProfileImage = async (userId: string) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profileImageUrl: null,
      profileImagePublicId: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImageUrl: true,
      profileImagePublicId: true,
      updatedAt: true,
    },
  });
};