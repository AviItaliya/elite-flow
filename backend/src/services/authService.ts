import authRepository from "../repositories/authRepository.js";
import crypto from "crypto";

import AppError from "../utils/AppError.js";

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

import { comparePassword, hashPassword } from "../utils/password.js";
import emailService from "./emailService.js";

class AuthService {
  async register(name: string, email: string, password: string) {
    const existingUser = await authRepository.findUserByEmail(email);

    if (existingUser) {
      throw new Error("Email already exists");
    }

    const hashedPassword = await hashPassword(password);

    return authRepository.createUser({
      name,
      email,
      password: hashedPassword,
    });
  }

  // ============================================================
  // LOGIN
  // ============================================================

  async login(email: string, password: string) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // IMPORTANT:
    // Do not allow inactive users to login.
    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Please contact an administrator.",
        403,
      );
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken(user.id, refreshToken, expiresAt);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  // ============================================================
  // REFRESH ACCESS TOKEN
  // ============================================================
  
  async refreshAccessToken(refreshToken: string) {
    const storedToken = await authRepository.findRefreshToken(refreshToken);
    if (!storedToken) {
      throw new AppError("Invalid refresh token", 401);
    }
    if (storedToken.expiresAt <= new Date()) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new AppError("Refresh token has expired", 401);
    }
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new AppError("Invalid or expired refresh token", 401);
    }
    if (payload.id !== storedToken.userId) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new AppError("Invalid refresh token", 401);
    }
    const user = await authRepository.findUserById(payload.id);
    if (!user) {
      await authRepository.deleteRefreshToken(refreshToken);
      throw new AppError("User not found", 401);
    }
    if (!user.isActive) {
      await authRepository.deleteAllRefreshToken(user.id);
      throw new AppError("Your account has been deactivated. Please contact an administrator.", 403);
    }
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await authRepository.rotateRefreshToken(
      refreshToken,
      user.id,
      newRefreshToken,
      expiresAt,
    );
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async logout(refreshToken: string) {
    await authRepository.deleteRefreshToken(refreshToken);

    return {
      message: "Logout Successful",
    };
  }

  // ============================================================
  // PROFILE
  // ============================================================

  async profile(userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Also prevent an inactive user from
    // accessing profile through a valid token.
    if (!user.isActive) {
      throw new AppError(
        "Your account has been deactivated. Please contact an administrator.",
        403,
      );
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async forgotPassword({ email }: { email: string }) {
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      return {
        message:
          "If an account exists with this email, a reset link has been sent.",
      };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await authRepository.setResetPasswordToken(user.id, hashedToken, expiresAt);

    await emailService.sendResetPasswordEmail(user.email, user.name, rawToken);

    return {
      message:
        "If an account exists with this email, a reset link has been sent.", 
        // token: rawToken
    };
  }

  async resetPassword({
    token,
    newPassword,
  }: {
    token: string;
    newPassword: string;
  }) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await authRepository.findUserByResetToken(hashedToken);

    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await authRepository.resetPassword(user.id, hashedPassword);

    return {
      message: "Password reset successful. Please login again.",
    };
  }
}

export default new AuthService();
