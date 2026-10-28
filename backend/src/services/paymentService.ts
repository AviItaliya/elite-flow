import { stripe } from "../config/stripe.js";
import { findActivePlanById } from "../repositories/planRepository.js";
import { findCompanySubscription } from "../repositories/subscriptionRepository.js";
import { createPayment, findPendingRenewalPayment, markPaymentExpiredBySessionId } from "../repositories/paymentRepository.js";
import { getSubscriptionRenewalEligibility } from "./subscriptionService.js";

export const createCheckoutSession = async (companyId: string, planId: string) => {
    const plan = await findActivePlanById(planId);
    if(!plan) {
        throw new Error("Plan not found or inactive");
    }
    const existingSubscription = await findCompanySubscription(companyId);
    if(existingSubscription) {
        throw new Error("Your company already has an active subscription");
    }
    const frontendUrl = process.env.FRONTEND_URL;
    if(!frontendUrl) {
        throw new Error("FRONTEND_URL is not configured");
    }
    const planPrice = Number(plan.price);
    const amountInPaise = Math.round(planPrice * 100);
    if(!Number.isFinite(planPrice) || !Number.isInteger(amountInPaise) || amountInPaise <= 0) {
        throw new Error("Invalid plan price");
    }
    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        // payment_method_types: ["card"],
        line_items: [{
            price_data: {
                currency: "inr",
                product_data: {
                    name: plan.name,
                    description: plan.description ?? undefined,
                },
                unit_amount: amountInPaise,
            },
            quantity: 1,
        }],
        client_reference_id: companyId,
        metadata: {
            companyId,
            planId,
        },
        success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/payment/cancelled`
    });
    if(!session.id || !session.url) {
        throw new Error("Failed to create Stripe Checkout Session");
    }
    await createPayment({
        companyId,
        planId,
        stripeCheckoutSessionId: session.id,
        amount: planPrice,
        currency: "inr"
    });
    return {
        paymentId: session.id,
        sessionId: session.id,
        checkoutUrl: session.url,
    };
};


export const createRenewalCheckoutSession = async (
  companyId: string,
  subscriptionId: string,
  newPlanId: string
) => {
  const eligibility = await getSubscriptionRenewalEligibility(
    companyId,
    subscriptionId
  );

  if (!eligibility.eligible) {
    throw new Error(
      eligibility.reason ?? "Subscription renewal is not available"
    );
  }

  const currentSubscription = eligibility.subscription;

  const plan = await findActivePlanById(newPlanId);

  if (!plan) {
    throw new Error("Plan not found or inactive");
  }

  
const pendingPayment = await findPendingRenewalPayment(
  currentSubscription.id
);

if (pendingPayment) {
  const existingSession = await stripe.checkout.sessions.retrieve(
    pendingPayment.stripeCheckoutSessionId
  );

  if (existingSession.status === "open" && existingSession.url) {
    // Reuse the existing Checkout session instead of creating a duplicate.
    return {
      paymentId: pendingPayment.id,
      sessionId: existingSession.id,
      checkoutUrl: existingSession.url,
    };
  }

  if (existingSession.status === "expired") {
    await markPaymentExpiredBySessionId(existingSession.id);
  } else {
    // A completed session may be waiting for webhook processing.
    // Do not create another Checkout session until it is reconciled.
    throw new Error(
      "Your previous renewal payment is processing. Please wait and try again."
    );
  }
}

  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  const planPrice = Number(plan.price);
  const amountInPaise = Math.round(planPrice * 100);

  if (
    !Number.isFinite(planPrice) ||
    !Number.isInteger(amountInPaise) ||
    amountInPaise <= 0
  ) {
    throw new Error("Invalid plan price");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `${plan.name} - Subscription Renewal`,
            description: plan.description ?? undefined,
          },
          unit_amount: amountInPaise,
        },
        quantity: 1,
      },
    ],
    client_reference_id: companyId,
    metadata: {
      companyId,
      planId: plan.id,
      purpose: "RENEWAL",
      renewalForSubscriptionId: currentSubscription.id,
    },
    success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/payment/cancelled`,
  });

  if (!session.id || !session.url) {
    throw new Error("Failed to create Stripe Checkout Session");
  }

  await createPayment({
    companyId,
    planId: plan.id,
    stripeCheckoutSessionId: session.id,
    amount: planPrice,
    currency: "inr",
    purpose: "RENEWAL",
    renewalForSubscriptionId: currentSubscription.id,
  });

  return {
    paymentId: session.id,
    sessionId: session.id,
    checkoutUrl: session.url,
  };
};