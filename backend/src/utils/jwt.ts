import jwt from "jsonwebtoken";
const accessSecret = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!accessSecret) {
  throw new Error("JWT_ACCESS_SECRET is not defined");
}

if (!refreshSecret) {
  throw new Error("JWT_REFRESH_SECRET is not defined");
}

export interface AccessTokenPayload {
    userId: string;
    role: string;
    companyId: string | null;
}

export interface RefreshTokenPayload {
    userId: string;
}

export const generateAccessToken = (payload: AccessTokenPayload): string => {
    return jwt.sign(payload, accessSecret, {
        expiresIn: "15m",
    });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
    return jwt.sign(payload, refreshSecret, {
        expiresIn: "7d",
    });
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, refreshSecret) as RefreshTokenPayload;
};