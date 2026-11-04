import type { Request, Response } from "express";
import type Stripe from "stripe";
import { stripe } from "../config/stripe.js";
import {handleCheckoutSessionCompleted} from "../services/stripeWebhookService.js";
import {markPaymentExpiredBySessionId, markPaymentFailedBySessionId, recordPaymentIntentFailure} from "../repositories/paymentRepository.js";
import {claimStripeWebhookEvent, markStripeWebhookEventProcessed, markStripeWebhookEventFailed} from "../repositories/stripeWebhookEventRepository.js";

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.message : "Unknown webhook processing error";
};

const processStripeEvent = async (event: Stripe.Event): Promise<void> => {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
      break;
    }
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;        
      await handleCheckoutSessionCompleted(session);
      console.log("Asynchronous checkout payment succeeded:", session.id);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      await markPaymentExpiredBySessionId(session.id);
      console.log("Checkout session expired:", session.id);
      break;
    }
    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await markPaymentFailedBySessionId(session.id);
      console.log("Checkout payment failed:", session.id);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentId = paymentIntent.metadata?.paymentId;
      const failureCode = paymentIntent.last_payment_error?.decline_code ?? paymentIntent.last_payment_error?.code ?? null;
      const failureMessage = paymentIntent.last_payment_error?.message ?? null; 
      if (!paymentId) {
        console.warn("PaymentIntent failure received without paymentId metadata:", paymentIntent.id);
      break;
      }
      const result = await recordPaymentIntentFailure({
        paymentId,
        paymentIntentId: paymentIntent.id,
        failureCode,
        failureMessage,
      });
      if (result.count === 0) {
        console.warn(
          "Payment failure details were not recorded. Payment may no longer be pending or may be linked to another PaymentIntent.",
          {
            paymentId,
            paymentIntentId: paymentIntent.id,
          },
        );
        break;
      }
      console.warn("Stripe payment failure recorded:", {
        paymentId,
        paymentIntentId: paymentIntent.id,
        failureCode,
        failureMessage,
      });
      break;
    }
    default: {
      console.log("Unhandled Stripe event:", event.type);
    }
  }
};

export const stripeWebhookController = async (req: Request, res: Response): Promise<void> => {
  let claimToken: string | null = null;
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    res.status(400).json({
      success: false,
      message: "Missing Stripe signature or webhook configuration",
    });
    return;
  }
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook signature",
    });
    return;
  }

  try {
    const claim = await claimStripeWebhookEvent({stripeEventId: event.id, eventType: event.type});
    if (claim.alreadyProcessed) {
      console.log("Duplicate Stripe event ignored:", event.id);
      res.status(200).json({
        received: true,
        duplicate: true,
      });
      return;
    }

    if (!claim.claimed || !claim.claimToken) {
      res.status(500).json({
        success: false,
        message: "Stripe event is currently being processed. Retry later.",
      });
      return;
    }
    claimToken = claim.claimToken;
    await processStripeEvent(event);
    await markStripeWebhookEventProcessed(event.id, claimToken);
    res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);

    if (claimToken) {
      try {
        await markStripeWebhookEventFailed(
          event.id,
          claimToken,
          getErrorMessage(error),
        );
      } catch (updateError) {
        console.error("Could not update Stripe webhook event failure status:", updateError);
      }
    }
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};