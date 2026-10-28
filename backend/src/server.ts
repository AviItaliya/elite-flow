import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { startSubscriptionReminderJob } from "./jobs/subscriptionReminderJob.js";
import { initializeSocket } from "./config/socket.js";

const PORT = Number(process.env.PORT) || 1213;
const httpServer = createServer(app);
initializeSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`EliteFlow API running on http://localhost:${PORT}`);
  startSubscriptionReminderJob();
});

httpServer.on("error", (error) => {
  console.error("Server error:", error);
});

httpServer.on("close", () => {
  console.log("EliteFlow server was closed");
});