import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AccessTokenPayload {
    userId: string;
    role: string;
    companyId: string | null;
}

const accesSecret = process.env.JWT_ACCESS_SECRET;
if(!accesSecret) {
    throw new Error("JWT_ACCESS_SECRET is not defined");
}

export interface AuthenticatedRequest extends Request {
    user?: AccessTokenPayload;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const authorization = req.headers.authorization;
        if(!authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if(!authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorizatio format",
            });
        }

        const token = authorization.split(" ")[1];

        if(!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is required",
            });
        }

        const decoded = jwt.verify(token, accesSecret) as AccessTokenPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired access token",
        });
    }
};