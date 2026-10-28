import { io } from "socket.io-client";
import readline from "node:readline";

const token = process.env.TEST_ACCESS_TOKEN;

if (!token) {
  console.error("Please set TEST_ACCESS_TOKEN before running this script.");
  process.exit(1);
}

const socket = io("http://localhost:1213", {
  auth: { token },
  reconnection: false,
});

socket.on("connect", () => {
  console.log("Socket connected successfully!");
  console.log("Socket ID:", socket.id);
  console.log("Waiting for a notification...");
  console.log("Press Ctrl+C to exit.");
});

socket.on("connect_error", (error) => {
  console.error("Socket connection failed:", error.message);
  process.exitCode = 1;
  socket.disconnect();
});

socket.on("notification", (notification) => {
  console.log("\nReal-time notification received:");
  console.log(JSON.stringify(notification, null, 2));
});