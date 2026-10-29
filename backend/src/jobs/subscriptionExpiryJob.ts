import cron from "node-cron";
import { expireSubscriptions } from "../services/subscriptionService.js";

export const startSubscriptionExpiryJob = () => {
  cron.schedule("*/15 * * * *", async () => {
    try {
      await expireSubscriptions();
      console.log("Subscription expiry job completed");
    } catch (error) {
      console.error("Subscription expiry job failed:", error);
    }
  });
  console.log("Subscription expiry cron job is running");
};