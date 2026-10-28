import type Stripe from "stripe";
import { prisma } from "../config/database.js";
import { findPaymentByCheckoutSessionId } from "../repositories/paymentRepository.js";
import { findActivePlanById } from "../repositories/planRepository.js";

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  if (session.payment_status !== "paid") return;

  const payment = await findPaymentByCheckoutSessionId(session.id);

  if (!payment) {
    throw new Error(`Payment record not found for session ${session.id}`);
  }

  if (payment.status === "SUCCESS") return;

  const metadata = session.metadata;

  if (
    metadata?.companyId !== payment.companyId ||
    metadata?.planId !== payment.planId ||
    (metadata?.purpose && metadata.purpose !== payment.purpose) ||
    (payment.purpose === "RENEWAL" &&
      metadata?.renewalForSubscriptionId !== payment.renewalForSubscriptionId)
  ) {
    throw new Error("Checkout Session metadata does not match payment");
  }

  const plan = await findActivePlanById(payment.planId);

  if (!plan) {
    throw new Error("The purchased plan is no longer active");
  }

  const expectedAmount = Math.round(Number(payment.amount) * 100);

  if (
    session.amount_total !== expectedAmount ||
    session.currency?.toLowerCase() !== payment.currency.toLowerCase()
  ) {
    throw new Error("Stripe payment amount or currency does not match");
  }

  const now = new Date();
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  await prisma.$transaction(async (tx) => {
    // Claim this payment exactly once.
    const claimedPayment = await tx.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
      },
      data: {
        status: "SUCCESS",
        paidAt: now,
        stripePaymentIntentId: paymentIntentId,
      },
    });

    // Another webhook already processed this payment.
    if (claimedPayment.count === 0) return;

    let startDate = now;

    if (payment.purpose === "RENEWAL") {
      if (!payment.renewalForSubscriptionId) {
        throw new Error("Renewal subscription reference is missing");
      }

      const currentSubscription = await tx.subscription.findFirst({
        where: {
          id: payment.renewalForSubscriptionId,
          companyId: payment.companyId,
          status: { in: ["ACTIVE", "TRIAL"] },
        },
      });

      if (!currentSubscription) {
        throw new Error(
          "Renewal subscription not found; payment requires review",
        );
      }

      const existingRenewal = await tx.subscription.findFirst({
        where: {
          companyId: payment.companyId,
          startDate: {
            gte: currentSubscription.endDate,
          },
          status: { in: ["ACTIVE", "TRIAL"] },
        },
      });

      if (existingRenewal) {
        throw new Error(
          "A renewal period already exists for this subscription. Payment requires review.",
        );
      }

      // If paid before expiry, preserve the remaining subscription time.
      // If Checkout completes after expiry, start the new period now.
      startDate =
        currentSubscription.endDate > now ? currentSubscription.endDate : now;
    } else {
      // A new purchase must not overlap an existing valid subscription.
      const activeSubscription = await tx.subscription.findFirst({
        where: {
          companyId: payment.companyId,
          status: { in: ["ACTIVE", "TRIAL"] },
          startDate: { lte: now },
          endDate: { gt: now },
        },
      });

      if (activeSubscription) {
        throw new Error(
          "Company already has an active subscription; payment needs review",
        );
      }
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const subscription = await tx.subscription.create({
      data: {
        companyId: payment.companyId,
        planId: payment.planId,
        status: "ACTIVE",
        startDate,
        endDate,
        ...(payment.purpose === "RENEWAL" && {
          renewedFromSubscriptionId: payment.renewalForSubscriptionId,
        }),
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        subscriptionId: subscription.id,
      },
    });

    // Reactivate the company after a successful subscription purchase.
    // Do not change individual user statuses here.
    await tx.company.updateMany({
      where: {
        id: payment.companyId,
        isSuspended: false,
      },
      data: {
        isActive: true,
      },
    });
  });
};
