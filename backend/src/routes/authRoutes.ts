import { Router } from "express";
import { forgotPasswordController, login, logout, refresh, register, requestOtp, resendVerificationEmailController, resetPasswordController, verifyEmailController, verifyOtp } from "../controllers/authController.js";
import { forgotPasswordRateLimiter, loginRateLimiter, otpRequestRateLimiter } from "../middleware/rateLimitMiddleware.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.get("/verify-email", verifyEmailController);
authRoutes.post("/resend-verification", forgotPasswordRateLimiter, resendVerificationEmailController);
authRoutes.post("/login", loginRateLimiter, login);
authRoutes.post("/refresh", refresh);
authRoutes.post("/logout", logout);
authRoutes.post("/forgot-password", forgotPasswordRateLimiter, forgotPasswordController);
authRoutes.post("/reset-password", resetPasswordController);
authRoutes.post("/request-otp", otpRequestRateLimiter, requestOtp);
authRoutes.post("/verify-otp", verifyOtp);

export default authRoutes;