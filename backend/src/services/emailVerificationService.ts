import { prisma } from "../config/database.js";

export const verifyEmail = async (token: string) => {
  const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: {
        token,
      },
      include: {
        user: true,
      },
    });
    
  if (!verificationToken) {
    throw new Error("Invalid verification token");
  }
  if (verificationToken.usedAt) {
    throw new Error("Verification token has already been used");
  }
  if (verificationToken.expiresAt < new Date()) {
    throw new Error("Verification token has expired");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: verificationToken.userId,
      },
      data: {
        isVerified: true,
      },
    }),

    prisma.emailVerificationToken.update({
      where: {
        id: verificationToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    }),
  ]);

  return {
    userId: verificationToken.userId,
    email: verificationToken.user.email,
  };
};