import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "../validators/authValidation.js";
import authService from "../services/authService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";
import AppError from "../utils/AppError.js";

class AuthController {
  async register(req: Request, res: Response) {
    const validatedData = registerSchema.parse(req.body);
    const user = await authService.register(
      validatedData.name,
      validatedData.email,
      validatedData.password,
    );
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: user,
    });
  }

  login = asyncHandler(async (req, res) => {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(
      validatedData.email,
      validatedData.password,
    );
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  });

  
  refreshToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;  
    if (!refreshToken) {
      throw new AppError("Refresh token is required", 401);
    }
    const result = await authService.refreshAccessToken(refreshToken);
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Access token refreshed successfully",
      data: {
        accessToken: result.accessToken,
      },
    });
  });

  
  logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;  
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Logout successful",
    });
  });

  profile = asyncHandler(async (req, res) => {
    const user = await authService.profile(req.user!.id);
    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Profile fetched successfully",
      data: user,
    });
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const result = await authService.forgotPassword({ email });

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: result.message,
      // data: {
      //       token: result.token,
      //   },
    });
  });

  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    const result = await authService.resetPassword({
      token,
      newPassword,
    });

    return sendResponse(res, {
      success: true,
      statusCode: 200,
      message: result.message,
    });
  });
}
export default new AuthController();
