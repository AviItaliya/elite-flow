import { prisma } from "../config/database.js";

export const findUserByEmail = async (email: string) =>
  prisma.user.findFirst({
    where: {
      email,
      deletedAt: null,
    },
  });

export const createCompany = async (name: string, email: string) => {
    return prisma.company.create({
        data: {
            name, email
        },
    });
};

export const createUser = async (data: {
    name: string,
    email: string,
    password: string,
    companyId: string
}) => {
    return prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password,
            companyId: data.companyId,
            role: "ADMIN",
        },
    });
};

export const createEmailVerificationToken = async (
    userId: string,
    token: string,
    expiresAt: Date
) => {
    return prisma.emailVerificationToken.create({
        data: {
            userId,
            token,
            expiresAt,
        },
    });
};

export const createRefreshToken = async (
  userId: string,
  token: string,
  expiresAt: Date
) => {
  return prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
};

export const findRefreshToken = async (token: string) => {
    return prisma.refreshToken.findUnique({
        where: {
            token,
        },
        include: {
            user: true,
        },
    });
};

export const revokeRefreshToken = async (token: string) => {
  return prisma.refreshToken.update({
    where: {
      token,
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

export const createPasswordResetToken = async (
  userId: string,
  token: string,
  expiresAt: Date
) => {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });
};

export const findPasswordResetToken = async (token: string) => {
  return prisma.passwordResetToken.findUnique({
    where: {
      token,
    },
    include: {
      user: true,
    },
  });
};

export const markPasswordResetTokenAsUsed = async (tokenId: string) => {
  return prisma.passwordResetToken.update({
    where: {
      id: tokenId,
    },
    data: {
      usedAt: new Date(),
    },
  });
};

export const updateUserPassword = async (
  userId: string,
  password: string
) => {
  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password,
    },
  });
};

export const createLoginOtp = async (
  userId: string,
  otpHash: string,
  expiresAt: Date
) => {
  return prisma.loginOtp.create({
    data: {
      userId,
      otpHash,
      expiresAt,
    },
  });
};

export const findLatestLoginOtp = async (userId: string) => {
  return prisma.loginOtp.findFirst({
    where: {
      userId,
      verifiedAt: null,
      invalidatedAt: null,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const markLoginOtpAsVerified = async (otpId: string) => {
  return prisma.loginOtp.update({
    where: {
      id: otpId,
    },
    data: {
      verifiedAt: new Date(),
    },
  });
};

export const incrementLoginOtpAttempts = async (otpId: string) => {
  return prisma.loginOtp.update({
    where: {
      id: otpId,
    },
    data: {
      attempts: {
        increment: 1,
      },
    },
  });
};

export const invalidateLoginOtp = async (otpId: string) => {
  return prisma.loginOtp.update({
    where: {
      id: otpId,
    },
    data: {
      invalidatedAt: new Date(),
    },
  });
};