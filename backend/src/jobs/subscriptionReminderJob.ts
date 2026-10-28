import cron from "node-cron";
import { prisma } from "../config/database.js";
import { sendSubscriptionReminderEmail } from "../services/subscriptionReminderEmailService.js";

const reminderDays = [
  { days: 7, type: "SEVEN_DAYS" },
  { days: 3, type: "THREE_DAYS" },
  { days: 1, type: "ONE_DAY" },
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const LEASE_MS = 5 * 60 * 1000;

const findSubscriptionsExpiringBetween = (start: Date, end: Date) =>
  prisma.subscription.findMany({
    where: { endDate: { gte: start, lte: end } },
    include: { company: true, plan: true },
  });

const runSubscriptionReminderJob = async () => {
  const now = new Date();

  for (const reminder of reminderDays) {
    const target = new Date(now.getTime() + reminder.days * DAY_MS);
    const start = new Date(target.getTime() - 12 * 60 * 60 * 1000);
    const end = new Date(target.getTime() + 12 * 60 * 60 * 1000);

    const subscriptions = await findSubscriptionsExpiringBetween(start, end);

    for (const subscription of subscriptions) {
      if (!subscription.company.isActive || subscription.company.isSuspended) {
        continue;
      }

      const existing = await prisma.subscriptionReminder.findUnique({
        where: {
          subscriptionId_type: {
            subscriptionId: subscription.id,
            type: reminder.type,
          },
        },
      });

      if (existing?.status === "SENT") continue;

      const claimUntil = new Date(Date.now() + LEASE_MS);

      if (!existing) {
        try {
          await prisma.subscriptionReminder.create({
            data: {
              subscriptionId: subscription.id,
              type: reminder.type,
              status: "PENDING",
              claimedUntil: claimUntil,
            },
          });
        } catch {
          // Another worker may have created the unique record.
          continue;
        }
      } else {
        const claimed = await prisma.subscriptionReminder.updateMany({
          where: {
            id: existing.id,
            status: { in: ["PENDING", "FAILED"] },
            OR: [
              { claimedUntil: null },
              { claimedUntil: { lt: now } },
            ],
          },
          data: { claimedUntil: claimUntil },
        });

        if (claimed.count === 0) continue;
      }

      const record = await prisma.subscriptionReminder.findUnique({
        where: {
          subscriptionId_type: {
            subscriptionId: subscription.id,
            type: reminder.type,
          },
        },
      });

      if (!record || record.status === "SENT") continue;

      try {
        await sendSubscriptionReminderEmail({
          companyName: subscription.company.name,
          companyEmail: subscription.company.email,
          planName: subscription.plan.name,
          endDate: subscription.endDate,
          daysRemaining: reminder.days as 7 | 3 | 1,
        });

        await prisma.subscriptionReminder.update({
          where: { id: record.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            claimedUntil: null,
            lastError: null,
          },
        });
      } catch (error) {
        await prisma.subscriptionReminder.update({
          where: { id: record.id },
          data: {
            status: "FAILED",
            claimedUntil: null,
            lastError:
              error instanceof Error
                ? error.message.slice(0, 1000)
                : "Unknown email delivery error",
          },
        });
      }
    }
  }
};

export const startSubscriptionReminderJob = () => {
  cron.schedule("0 9 * * *", async () => {
    try {
      await runSubscriptionReminderJob();
    } catch (error) {
      console.error("Subscription reminder job failed:", error);
    }
  }, { timezone: "Asia/Kolkata" });
};