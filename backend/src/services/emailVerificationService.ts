import { prisma } from "../config/database.js";
import {createEmailVerificationToken, findLatestEmailVerificationToken, findUserByEmail} from "../repositories/authRepository.js";
import { verificationEmailTemplate } from "../templates/verificationEmail.js";
import { generateRandomToken } from "../utils/token.js";
import { sendEmail } from "./emailService.js";

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

export const resendVerificationEmail = async (email: string) => {
  const user = await findUserByEmail(email);

  // Avoid revealing whether an email address is registered.
  if (!user || user.isVerified || user.status !== "ACTIVE") {
    return;
  }

  const latestToken = await findLatestEmailVerificationToken(user.id);

  // Cooldown: one request every 60 seconds.
  if (latestToken && Date.now() - latestToken.createdAt.getTime() < 60_000) {
    throw new Error("Please wait before requesting another verification email");
  }

  // Validate the frontend URL before creating a database token.
  const frontendUrl = process.env.FRONTEND_URL?.trim();

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  let parsedFrontendUrl: URL;

  try {
    parsedFrontendUrl = new URL(frontendUrl);
  } catch {
    throw new Error("FRONTEND_URL must be a valid URL");
  }

  if (parsedFrontendUrl.protocol !== "http:" && parsedFrontendUrl.protocol !== "https:") {
    throw new Error("FRONTEND_URL must use HTTP or HTTPS");
  }

  const normalizedFrontendUrl = frontendUrl.replace(/\/+$/, "");
  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await createEmailVerificationToken(user.id, token, expiresAt);
  const verificationUrl = `${normalizedFrontendUrl}/verify-email?token=${encodeURIComponent(token)}`;

  await sendEmail({
    to: user.email,
    subject: "Verify your EliteFlow email",
    html: verificationEmailTemplate(user.name, verificationUrl),
  });
};