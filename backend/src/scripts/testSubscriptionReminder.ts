
import "dotenv/config";
import { verifyEmailConnection } from "../config/email.js";
import { sendSubscriptionReminderEmail } from "../services/subscriptionReminderEmailService.js";

const main = async () => {
  await verifyEmailConnection();

  const result = await sendSubscriptionReminderEmail({
    companyName: "EliteFlow Test Company",
    companyEmail: process.env.SMTP_USER!,
    planName: "Professional",
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    daysRemaining: 7,
  });

  console.log("Reminder email accepted:", result.messageId);
};

main().catch((error) => {
  console.error("Reminder email test failed:", error);
  process.exitCode = 1;
});