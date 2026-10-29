import { stripe } from "../config/stripe.js";
import {findReviewRequiredPaymentById, findPaymentById} from "../repositories/paymentRepository.js";
import { handleCheckoutSessionCompleted } from "./stripeWebhookService.js";

export const recoverReviewRequiredPayment = async (
  paymentId: string,
) => {
  const payment = await findReviewRequiredPaymentById(paymentId);

  if (!payment) {
    throw new Error("Payment not found or does not require review");
  }

  if (payment.subscriptionId || payment.subscription) {
    throw new Error("This payment already has an associated subscription. Manual review is required.");
  }

  const session = await stripe.checkout.sessions.retrieve(payment.stripeCheckoutSessionId);

  if (
    session.id !== payment.stripeCheckoutSessionId ||
    session.status !== "complete" ||
    session.payment_status !== "paid"
  ) {
    throw new Error("Stripe has not confirmed a completed, paid Checkout Session. Payment remains under review.");
  }

  await handleCheckoutSessionCompleted(session, {
    allowReviewRequired: true,
  });

  // Verify the final database state before reporting recovery success.
  const updatedPayment = await findPaymentById(payment.id);

  if (
    updatedPayment?.status !== "SUCCESS" || !updatedPayment.subscriptionId) {
    throw new Error("Recovery did not create a subscription. The payment requires further review.");
  }

  return {
    success: true,
    message: "Payment recovery processed successfully",
    paymentId: payment.id,
    subscriptionId: updatedPayment.subscriptionId,
  };
};