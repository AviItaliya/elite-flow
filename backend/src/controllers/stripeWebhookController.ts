
import type { Request, Response } from "express";
import type Stripe from "stripe";

import { stripe } from "../config/stripe.js";
import { handleCheckoutSessionCompleted } from "../services/stripeWebhookService.js";
import {
  markPaymentExpiredBySessionId,
  markPaymentFailedBySessionId,
} from "../repositories/paymentRepository.js";

export const stripeWebhookController = async (
  req: Request,
  res: Response
) => {
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
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);

    res.status(400).json({
      success: false,
      message: "Invalid Stripe webhook signature",
    });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
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

      default:
        console.log("Unhandled Stripe event:", event.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);

    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};