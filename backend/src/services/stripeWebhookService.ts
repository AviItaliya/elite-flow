import type Stripe from "stripe";
import { prisma } from "../config/database.js";
import {findPaymentByCheckoutSessionId, markPendingPaymentReviewRequired} from "../repositories/paymentRepository.js";
import { findActivePlanById } from "../repositories/planRepository.js";

interface CheckoutProcessingOptions {
  allowReviewRequired?: boolean;
}

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
  options: CheckoutProcessingOptions = {},
): Promise<void> => {
  if (session.payment_status !== "paid") {
    return;
  }

  const payment = await findPaymentByCheckoutSessionId(session.id);

  if (!payment) {
    throw new Error(`Payment record not found for session ${session.id}`);
  }

  if (payment.status === "SUCCESS") {
    return;
  }

  if (payment.status === "REVIEW_REQUIRED" && !options.allowReviewRequired) {
    throw new Error(`Payment ${payment.id} requires review before webhook processing can continue`);
  }

  if (payment.status !== "PENDING" && payment.status !== "REVIEW_REQUIRED") {
    throw new Error(`Payment ${payment.id} cannot be processed from status ${payment.status}`);
  }

  if (payment.status === "REVIEW_REQUIRED" && !options.allowReviewRequired) {
    throw new Error(`Payment ${payment.id} requires manual review`);
  }

  const metadata = session.metadata;

  if (
    metadata?.companyId !== payment.companyId ||
    metadata?.planId !== payment.planId ||
    (metadata?.purpose && metadata.purpose !== payment.purpose) ||
    (payment.purpose === "RENEWAL" &&
      metadata?.renewalForSubscriptionId !==
        payment.renewalForSubscriptionId)
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

  try {
    await prisma.$transaction(async (tx) => {
      // Atomically claim the payment. Recovery can claim REVIEW_REQUIRED;
      // normal webhook processing can claim only PENDING.
      const claimedPayment = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: options.allowReviewRequired
            ? { in: ["PENDING", "REVIEW_REQUIRED"] }
            : "PENDING",
        },
        data: {
          status: "SUCCESS",
          paidAt: now,
          ...(paymentIntentId && {
            stripePaymentIntentId: paymentIntentId,
          }),
        },
      });

      // Another process has already claimed or processed this payment.
      if (claimedPayment.count === 0) {
        return;
      }

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
          throw new Error("Renewal subscription not found; payment requires review");
        }

        if (!currentSubscription.endDate) {
          throw new Error("Permanent Free subscriptions cannot use the paid renewal flow. Use plan upgrade checkout instead.");
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
          throw new Error("A renewal period already exists for this subscription. Payment requires review.");
        }

        // Preserve remaining subscription time when paid before expiry.
        startDate = currentSubscription.endDate > now ? currentSubscription.endDate : now;
      } else {
        // Check whether the company already has a valid subscription.
        const activeSubscriptions = await tx.subscription.findMany({
          where: {
            companyId: payment.companyId,
            status: { in: ["ACTIVE", "TRIAL"] },
            startDate: { lte: now },
            OR: [{ endDate: null }, { endDate: { gt: now } }],
          },
          include: {
            plan: true,
          },
        });

        if (activeSubscriptions.length > 0) {
          // A permanent Free subscription can be upgraded to a paid plan.
          const freeSubscription = activeSubscriptions.find(
            (subscription) =>
              Number(subscription.plan.price) === 0 &&
              subscription.status === "ACTIVE" &&
              subscription.endDate === null,
          );

          if (!freeSubscription || activeSubscriptions.length !== 1) {
            throw new Error("Company already has an active subscription; payment requires review");
          }

          // Preserve the Free subscription as history.
          await tx.subscription.update({
            where: {
              id: freeSubscription.id,
            },
            data: {
              status: "CANCELLED",
            },
          });
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
        where: {
          id: payment.id,
        },
        data: {
          subscriptionId: subscription.id,
        },
      });

      // Reactivate the company without changing individual user statuses.
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
  } catch (error) {
    try {
      // A failed transaction rolls back its SUCCESS status update.
      // This helper changes only PENDING payments, so it won't overwrite
      // the REVIEW_REQUIRED status of a recovery attempt.
      await markPendingPaymentReviewRequired(
        payment.id,
        paymentIntentId,
      );
    } catch (recoveryError) {
      console.error("Failed to mark payment for review:", {
        paymentId: payment.id,
        sessionId: session.id,
        recoveryError,
      });
    }
    throw error;
  }
};