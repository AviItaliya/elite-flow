import { authConfig } from "../config/auth";
import { createLoginOtp, createRefreshToken, findLatestLoginOtp, findUserByEmail, incrementLoginOtpAttempts, markLoginOtpAsVerified } from "../repositories/authRepository";
import { otpEmailTemplate } from "../templates/otpEmail";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { compareOtp, generateOtp, hashOtp } from "../utils/otp";
import { RequestOtpInput, VerifyOtpInput } from "../validators/authValidator";
import { sendEmail } from "./emailService";

export const requestLoginOtp = async (
  data: RequestOtpInput
) => {
  const user = await findUserByEmail(data.email);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is inactive");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email before requesting OTP");
  }

  const otp = generateOtp();

  const otpHash = hashOtp(otp);

  const expiresAt = new Date(
    Date.now() +
      authConfig.otpExpiresInMinutes * 60 * 1000
  );

  await createLoginOtp(
    user.id,
    otpHash,
    expiresAt
  );

  await sendEmail({
  to: user.email,
  subject: "Your EliteFlow login OTP",
  html: otpEmailTemplate(
    user.name,
    otp
  ),
});

  return {
    otp,
    expiresAt,
  };
};

export const verifyLoginOtp = async (
  data: VerifyOtpInput
) => {
  const user = await findUserByEmail(data.email);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is inactive");
  }

  const loginOtp = await findLatestLoginOtp(user.id);

  if (!loginOtp) {
    throw new Error("OTP not found");
  }

  if (loginOtp.verifiedAt) {
    throw new Error("OTP has already been used");
  }

  if (loginOtp.expiresAt < new Date()) {
    throw new Error("OTP has expired");
  }

  if (
    loginOtp.attempts >=
    authConfig.otpMaxAttempts
  ) {
    throw new Error("Maximum OTP attempts exceeded");
  }

  const isValid = compareOtp(
    data.otp,
    loginOtp.otpHash
  );

  if (!isValid) {
    await incrementLoginOtpAttempts(loginOtp.id);

    throw new Error("Invalid OTP");
  }

  await markLoginOtpAsVerified(loginOtp.id);

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role,
    companyId: user.companyId,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
  });

  const refreshTokenExpiresAt = new Date(Date.now() + authConfig.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);

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
