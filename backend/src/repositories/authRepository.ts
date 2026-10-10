import prisma from "../config/prisma.js";
import crypto from "crypto";
import AppError from "../utils/AppError.js";
import { hashPassword, comparePassword } from "../utils/password.js";

class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async createUser(data: { name: string; email: string; password: string }) {
    return prisma.user.create({
      data,
    });
  }

  async createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return prisma.refreshToken.create({
      data: {
        token,
        expiresAt,
        userId,
      },
    });
  }

  async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async deleteRefreshToken(token: string) {
    return prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteAllRefreshToken(userId: string) {
    return prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async setResetPasswordToken(userId: string, token: string, expiresAt: Date) {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: expiresAt,
      },
    });
  }

  async findUserByResetToken(token: string) {
    return prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: {
          gt: new Date(),
        },
      } as any,
    });
  }

  async resetPassword(userId: string, password: string) {
    return prisma.$transaction([
      prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password,
          resetPasswordToken: null,
          resetPasswordExpiresAt: null,
        },
      }),

      prisma.refreshToken.deleteMany({
        where: {
          userId,
        },
      }),
    ]);
  }
  
  async rotateRefreshToken(oldToken: string, userId: string, newToken: string, expiresAt: Date) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.refreshToken.deleteMany({
        where: {
          token: oldToken,
          userId,
        },
      });

      if (deleted.count !== 1) {
        throw new AppError("Invalid refresh token", 401);
      }
      return tx.refreshToken.create({
        data: {
          token: newToken,
          userId,
          expiresAt,
        },
      });
    });
  }
}

export default new AuthRepository();