import { transporter } from "../config/email.js";
import { findCompanyReminderHistory } from "../repositories/subscriptionReminderRepository.js";
import { sendEmail } from "./emailService.js";

type ReminderEmailData = {
  companyName: string;
  companyEmail: string;
  planName: string;
  endDate: Date;
  daysRemaining: 7 | 3 | 1;
};

export const sendSubscriptionReminderEmail = async (
  data: ReminderEmailData
) => {
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }
  const formattedEndDate = data.endDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const subject = data.daysRemaining === 1 ? "Your EliteFlow subscription expires tomorrow" : `Your EliteFlow subscription expires in ${data.daysRemaining} days`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <body style="margin:0;padding:24px;background:#f5f4f8;font-family:Arial,sans-serif;color:#252238;">
        <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;padding:32px;">
          <h1 style="margin-top:0;color:#6d4aff;">EliteFlow</h1>
          <h2>Subscription expiry reminder</h2>
          <p>Hello ${escapeHtml(data.companyName)},</p>
          <p>
            Your <strong>${escapeHtml(data.planName)}</strong>
            subscription will expire in
            <strong>${data.daysRemaining} day${data.daysRemaining === 1 ? "" : "s"}</strong>.
          </p>
          <p>Current expiry date: <strong>${formattedEndDate}</strong></p>
          <p>Renew your subscription to maintain access to your workspace.</p>
          <p style="margin:28px 0;">
            <a href="${escapeHtml(frontendUrl)}/settings/subscription"
               style="background:#6d4aff;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;">
              Review subscription
            </a>
          </p>
          <p style="font-size:12px;color:#777;">
            If you have already renewed, you can ignore this reminder.
          </p>
        </div>
      </body>
    </html> `;

  return sendEmail({
    to: data.companyEmail,
    subject,
    html,
  });
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });

export const getCompanyReminderHistory = async (
  companyId: string,
  page: number,
  limit: number
) => {
  if (!companyId) {
    throw new Error("Company ID is required");
  }
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Invalid pagination parameters");
  }
  return findCompanyReminderHistory(companyId, page, limit);
};