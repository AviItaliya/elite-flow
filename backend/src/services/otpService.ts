import { authConfig } from "../config/auth.js";
import { createLoginOtp, createRefreshToken, findLatestLoginOtp, findUserByEmail, incrementLoginOtpAttempts, invalidateLoginOtp, markLoginOtpAsVerified } from "../repositories/authRepository.js";
import { otpEmailTemplate } from "../templates/otpEmail.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { compareOtp, generateOtp, hashOtp } from "../utils/otp.js";
import { RequestOtpInput, VerifyOtpInput } from "../validators/authValidator.js";
import { sendEmail } from "./emailService.js";

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

  const latestOtp = await findLatestLoginOtp(user.id);
  if(latestOtp) {
    const cooldownMilliseconds = authConfig.otpResendCooldownSeconds * 1000;
    const nextAllowedTime = latestOtp.createdAt.getTime() + cooldownMilliseconds;
    const remainingMilliseconds = nextAllowedTime - Date.now();
    if(remainingMilliseconds > 0) {
      const remainingSeconds = Math.ceil(remainingMilliseconds / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before requesting another OTP`);
    }
    await invalidateLoginOtp(latestOtp.id);
  }

  const otp = generateOtp();

  const otpHash = hashOtp(otp);

  const expiresAt = new Date(Date.now() + authConfig.otpExpiresInMinutes * 60 * 1000);

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
    throw new Error("Invalid or expired OTP");
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
