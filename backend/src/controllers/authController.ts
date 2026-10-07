import { Request, Response } from "express";
import { forgotPasswordSchema, loginSchema, registerSchema, requestOtpSchema, resetPasswordSchema, verifyOtpSchema } from "../validators/authValidator";
import { forgotPassword, loginUser, logoutUser, refreshAccessToken, registerUser, resetPassword } from "../services/authService";
import { verifyEmail } from "../services/emailVerificationService";
import { requestLoginOtp, verifyLoginOtp } from "../services/otpService";
import { refreshCookieConfig } from "../config/cookie";

export const register = async (req: Request, res: Response) => {
    try {
        const data = registerSchema.parse(req.body);
        const result = await registerUser(data);
        return res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                user: result.user,
                verificationToken: result.verificationToken,
            },
        });
    } catch (error) {
        if(error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const verifyEmailController = async (req:Request, res: Response) => {
    try {
        const token = req.query.token;
        if(typeof token !== "string" || !token) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required",
            });
        }
        const result = await verifyEmail(token);
        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            data: result,
        });
    } catch (error) {
        if(error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const login = async (req:Request, res:Response) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await loginUser(data);
        res.cookie("refreshToken", result.refreshToken, refreshCookieConfig);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
              user: result.user,
              accessToken: result.accessToken,
            },
        });
    } catch (error) {
        if(error instanceof Error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
        });
    }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is missing",
      });
    }
    const result = await refreshAccessToken(refreshToken);
    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is missing",
      });
    }
    await logoutUser(refreshToken);
    res.clearCookie("refreshToken", refreshCookieConfig);
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const forgotPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = forgotPasswordSchema.parse(
      req.body
    );

    const token = await forgotPassword(data);

    return res.status(200).json({
      success: true,
      message:
        "If the email exists, a password reset link has been sent",
      ...(process.env.NODE_ENV === "development" && token
        ? { resetToken: token }
        : {}),
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = resetPasswordSchema.parse(
      req.body
    );

    await resetPassword(data);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const requestOtp = async (req: Request, res: Response) => {
  try {
    const data = requestOtpSchema.parse(req.body);
    const result = await requestLoginOtp(data);
    return res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      data: {
        expiresAt: result.expiresAt
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const data = verifyOtpSchema.parse(req.body);
    const result = await verifyLoginOtp(data);
    res.cookie("refreshToken", result.refreshToken, refreshCookieConfig);
    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
              user: result.user,
              accessToken: result.accessToken,
        },
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};