import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters"),

  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase(),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),

  companyName: z
    .string()
    .min(2, "Company name must be at least 2 characters")
    .max(150, "Company name must not exceed 150 characters"),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase(),

  password: z
    .string()
    .min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required"),
});
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const logoutSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required"),
});
export type LogoutInput = z.infer<typeof logoutSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const requestOtpSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase(),
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .toLowerCase(),

  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;