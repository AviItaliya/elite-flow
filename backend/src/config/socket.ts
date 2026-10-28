import { Server } from "socket.io";
import type { Server as HttpServer } from "node:http";
import jwt from "jsonwebtoken";

interface AccessTokenPayload {
  userId: string;
  role: string;
  companyId: string | null;
}

let io: Server | null = null;
const accessSecret = process.env.JWT_ACCESS_SECRET;
if (!accessSecret) {
  throw new Error("JWT_ACCESS_SECRET is not defined");
}

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (typeof token !== "string" || !token) {
        return next(new Error("Authentication required"));
      }
      const decoded = jwt.verify(token, accessSecret) as AccessTokenPayload;
      if (!decoded.userId || typeof decoded.role !== "string" || !("companyId" in decoded)) {
        return next(new Error("Invalid access token payload"));
      }
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as AccessTokenPayload;
    socket.join(`user:${user.userId}`);
    console.log(`Socket connected for user: ${user.userId}`);
    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected for user ${user.userId}: ${reason}`);
    });
  });
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }
  return io;
};