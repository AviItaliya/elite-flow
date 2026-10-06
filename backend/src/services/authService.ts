import { createCompany, createEmailVerificationToken, createPasswordResetToken, createRefreshToken, createUser, findPasswordResetToken, findRefreshToken, findUserByEmail, markPasswordResetTokenAsUsed, revokeRefreshToken, updateUserPassword } from "../repositories/authRepository";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { comparePassword, hashPassword } from "../utils/password";
import { generateRandomToken } from "../utils/token";
import { ForgotPasswordInput, LoginInput, RegisterInput, ResetPasswordInput } from "../validators/authValidator";
import { prisma } from "../config/database";
import { sendEmail } from "./emailService";
import { verificationEmailTemplate } from "../templates/verificationEmail";
import { passwordResetEmailTemplate } from "../templates/passwordResetEmail";

export const registerUser = async (data: RegisterInput) => {
    const existingUSer = await findUserByEmail(data.email);
    if(existingUSer) {
        throw new Error("Email is already registered");
    }
    const hashedPassword = await hashPassword(data.password);
    const company = await createCompany(data.companyName, data.email);
    const user = await createUser({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        companyId: company.id
    });
    const verificationToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await createEmailVerificationToken(user.id, verificationToken, expiresAt);
    const verificationUrl =
  `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

await sendEmail({
  to: user.email,
  subject: "Verify your EliteFlow email",
  html: verificationEmailTemplate(
    user.name,
    verificationUrl
  ),
});
    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        },
    };
};

export const loginUser = async (data: LoginInput) => {
    const user = await findUserByEmail(data.email);

    if(!user) {
        throw new Error("Invalid email or password");
    }

    if(user.status !== "ACTIVE") {
        throw new Error("Your account is inactive");
    }

    if(!user.isVerified) {
        throw new Error("Please verify your email before logging in");
    }

    const passwordMatches = await comparePassword(
        data.password,
        user.password
    );

    if(!passwordMatches) {
        throw new Error("Invalid email or password");
    }

    const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
        companyId: user.companyId
    });

    const refreshToken = generateRefreshToken({
        userId: user.id
    });

    const refreshTokenExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await createRefreshToken(
        user.id,
        refreshToken,
        refreshTokenExpiresAt
    );

    return {
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
        },
        accessToken,
        refreshToken,
    };
};

export const refreshAccessToken = async (refreshToken: string) => {
    const storedToken = await findRefreshToken(refreshToken);

    if(!storedToken) {
        throw new Error("Invalid refresh token");
    }

    if(storedToken.revokedAt) {
        throw new Error("Refresh token has been revoked");
    }

    if(storedToken.expiresAt < new Date()) {
        throw new Error("Refresh token has expired");
    }

    try {
        verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new Error("Invalid refresh token");
    }

    const user = storedToken.user;

    if(user.status !== "ACTIVE") {
        throw new Error("Your account is inactive");
    }

    const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
        companyId: user.companyId,
    });
    return {
        accessToken,
    };
};

export const logoutUser = async (refreshToken: string) => {
  const storedToken = await findRefreshToken(refreshToken);
  if (!storedToken) {
    throw new Error("Invalid refresh token");
  }

  if (storedToken.revokedAt) {
    throw new Error("Refresh token has already been revoked");
  }
  await revokeRefreshToken(refreshToken);
  return true;
};

export const forgotPassword = async (data: ForgotPasswordInput) => {
  const user = await findUserByEmail(data.email);
  if (!user) {
    return;
  }
  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await createPasswordResetToken(
    user.id,
    token,
    expiresAt
  );
  const resetUrl =
  `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

await sendEmail({
  to: user.email,
  subject: "Reset your EliteFlow password",
  html: passwordResetEmailTemplate(
    user.name,
    resetUrl
  ),
});
  return token;
};

export const resetPassword = async (data: ResetPasswordInput) => {
  const resetToken = await findPasswordResetToken(data.token);

  if (!resetToken) {
    throw new Error("Invalid password reset token");
  }

  if (resetToken.usedAt) {
    throw new Error("Password reset token has already been used");
  }

  if (resetToken.expiresAt < new Date()) {
    throw new Error("Password reset token has expired");
  }

  const hashedPassword = await hashPassword(data.password);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    await tx.passwordResetToken.update({
      where: {
        id: resetToken.id,
      },
      data: {
        usedAt: new Date(),
      },
    });
  });
};
