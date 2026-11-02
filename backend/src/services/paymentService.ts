import { stripe } from "../config/stripe.js";
import { findActivePlanById } from "../repositories/planRepository.js";
import { findCompanySubscription } from "../repositories/subscriptionRepository.js";
import { createPayment, findPendingRenewalPayment, markPaymentExpiredBySessionId, updatePaymentCheckoutSessionId } from "../repositories/paymentRepository.js";
import { getSubscriptionRenewalEligibility } from "./subscriptionService.js";
import { prisma } from "../config/database.js";

export const createCheckoutSession = async (companyId: string, planId: string) => {
  const plan = await findActivePlanById(planId);
  if (!plan) {
    throw new Error("Plan not found or inactive");
  }
  const planPrice = Number(plan.price);
  const amountInPaise = Math.round(planPrice * 100);
  if (!Number.isFinite(planPrice) || !Number.isInteger(amountInPaise) || amountInPaise <= 0) {
    throw new Error("Invalid paid plan price");
  }
  const existingSubscription = await findCompanySubscription(companyId);
  if (existingSubscription) {
    const isPermanentFreePlan = Number(existingSubscription.plan.price) === 0 && existingSubscription.status === "ACTIVE" &&
      existingSubscription.endDate === null;
    if (!isPermanentFreePlan) {
      throw new Error("Your company already has an active subscription. Use the renewal or plan-change flow.");
    }
  }
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }
  const pendingPayment = await prisma.payment.findFirst({
    where: {
      companyId,
      purpose: "NEW_SUBSCRIPTION",
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });
  if (pendingPayment) {
    if (!pendingPayment.stripeCheckoutSessionId) {
      throw new Error("Your previous payment is being initialized. Please wait and try again.");
    }
    const existingSession = await stripe.checkout.sessions.retrieve(pendingPayment.stripeCheckoutSessionId);
    if (existingSession.status === "open" && existingSession.url) {
      if (pendingPayment.planId !== planId) {
        throw new Error("You already have a pending checkout for another plan. Complete or expire it before selecting another plan.");
      }
      return {
        paymentId: pendingPayment.id,
        sessionId: existingSession.id,
        checkoutUrl: existingSession.url,
      };
    }
    if (existingSession.status !== "expired") {
      throw new Error("Your previous payment is processing. Please wait before trying again.");
    }
    await markPaymentExpiredBySessionId(existingSession.id);
  }
  const payment = await createPayment({
    companyId,
    planId: plan.id,
    amount: planPrice,
    currency: "inr",
    purpose: "NEW_SUBSCRIPTION",
  });
  let sessionId: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: plan.name,
              description: plan.description ?? undefined,
            },
            unit_amount: amountInPaise,
          },
          quantity: 1,
        },
      ],
      client_reference_id: companyId,
      metadata: {
        paymentId: payment.id,
        companyId,
        planId: plan.id,
        purpose: "NEW_SUBSCRIPTION",
    },
    payment_intent_data: {
      metadata: {
        paymentId: payment.id,
        companyId,
        planId: plan.id,
        purpose: "NEW_SUBSCRIPTION",
      },
    },
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancelled`,
    });
    if (!session.id || !session.url) {
      throw new Error("Failed to create Stripe Checkout Session");
    }
    sessionId = session.id;
    const linkedPayment = await updatePaymentCheckoutSessionId(payment.id, session.id);
    if (linkedPayment.count !== 1) {
      throw new Error(`Failed to link Checkout Session ${session.id} to payment ${payment.id}`);
    }
    return {
      paymentId: payment.id,
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    if (sessionId) {
      try {
        await stripe.checkout.sessions.expire(sessionId);
      } catch (expireError) {
        console.error("Failed to expire orphaned checkout session:", {
          sessionId,
          expireError,
        });
      }
    }
    await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
      },
      data: {
        status: "FAILED",
      },
  });
    throw error;
  }
};

export const createRenewalCheckoutSession = async (companyId: string, subscriptionId: string, newPlanId: string) => {
  const eligibility = await getSubscriptionRenewalEligibility(companyId, subscriptionId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason ?? "Subscription renewal is not available");
  }
  const currentSubscription = eligibility.subscription;
  const plan = await findActivePlanById(newPlanId);
  if (!plan) {
    throw new Error("Plan not found or inactive");
  }
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }
  // Check whether this subscription has already been renewed.
  // const existingRenewalSubscription = await prisma.subscription.findFirst({
  //   where: {
  //     companyId,
  //     renewedFromSubscriptionId: currentSubscription.id,
  //     status: {
  //       in: ["ACTIVE", "TRIAL"],
  //     },
  //   },
  // });  
  const existingRenewalSubscription = await prisma.subscription.findFirst({
    where: {
      renewedFromSubscriptionId: currentSubscription.id,
    },
  });
  if (existingRenewalSubscription) {
    throw new Error("This subscription has already been renewed. Please use the latest subscription.");
  }
  const pendingPayment = await findPendingRenewalPayment(currentSubscription.id);
  if (pendingPayment) {
    if (pendingPayment.status === "REVIEW_REQUIRED") {
      throw new Error("Your previous renewal payment requires review. Please contact support.");
    }
    if (!pendingPayment.stripeCheckoutSessionId) {
      throw new Error("Your previous renewal payment is being initialized. Please wait and try again.");
    }
    const existingSession = await stripe.checkout.sessions.retrieve(pendingPayment.stripeCheckoutSessionId);
    if (existingSession.status === "open" && existingSession.url) {
      if (pendingPayment.planId !== plan.id) {
        throw new Error("You already have a pending renewal checkout for another plan. Complete or expire it before selecting another plan.");
      }
      return {
        paymentId: pendingPayment.id,
        sessionId: existingSession.id,
        checkoutUrl: existingSession.url,
      };
    }
    if (existingSession.status === "expired") {
      await markPaymentExpiredBySessionId(existingSession.id);
    } else {
      throw new Error("Your previous renewal payment is processing. Please wait before trying again.");
    }
  }
  const planPrice = Number(plan.price);
  const amountInPaise = Math.round(planPrice * 100);
  if (!Number.isFinite(planPrice) || !Number.isInteger(amountInPaise) || amountInPaise <= 0) {
    throw new Error("Invalid plan price");
  }
  const payment = await createPayment({
    companyId,
    planId: plan.id,
    amount: planPrice,
    currency: "inr",
    purpose: "RENEWAL",
    renewalForSubscriptionId: currentSubscription.id,
  });
let sessionId: string | null = null;
  try {
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
        paymentId: payment.id,
        companyId,
        planId: plan.id,
        purpose: "RENEWAL",
        renewalForSubscriptionId: currentSubscription.id,
      },
    payment_intent_data: {
      metadata: {
        paymentId: payment.id,
        companyId,
        planId: plan.id,
        purpose: "RENEWAL",
        renewalForSubscriptionId: currentSubscription.id,
      },
    },
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancelled`,
    });
    if (!session.id || !session.url) {
      throw new Error("Failed to create Stripe Checkout Session");
    }
    sessionId = session.id;
    const linkedPayment = await updatePaymentCheckoutSessionId(payment.id, session.id);
    if (linkedPayment.count !== 1) {
      throw new Error(`Failed to link Checkout Session ${session.id} to payment ${payment.id}`);
    }
    return {
      paymentId: payment.id,
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    if (sessionId) {
      try {
        await stripe.checkout.sessions.expire(sessionId);
      } catch (expireError) {
        console.error("Failed to expire orphaned renewal checkout:", {
          sessionId,
          expireError,
        });
      }
    }
    await prisma.payment.updateMany({
    where: {
      id: payment.id,
      status: "PENDING",
    },
    data: {
      status: "FAILED",
    },
  });
    throw error;
  }
};


export const createPlanChangeCheckoutSession = async (companyId: string, newPlanId: string) => {
  const newPlan = await findActivePlanById(newPlanId);
  if (!newPlan) {
    throw new Error("Plan not found or inactive");
  }
  const planPrice = Number(newPlan.price);
  const amountInPaise = Math.round(planPrice * 100);
  if (!Number.isFinite(planPrice) || !Number.isInteger(amountInPaise) || amountInPaise <= 0) {
    throw new Error("Plan changes require a valid paid plan");
  }
  const currentSubscription = await findCompanySubscription(companyId);
  if (!currentSubscription) {
    throw new Error("No active subscription found. Use the new subscription flow instead.");
  }
  if (currentSubscription.planId === newPlan.id) {
    throw new Error("Your company is already subscribed to this plan");
  }
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }
  const pendingPayment = await prisma.payment.findFirst({
    where: {
      companyId,
      purpose: "PLAN_CHANGE",
      planChangeForSubscriptionId: currentSubscription.id,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (pendingPayment) {
    if (!pendingPayment.stripeCheckoutSessionId) {
      throw new Error("Your previous plan-change payment is being initialized. Please wait and try again.");
    }
    const existingSession = await stripe.checkout.sessions.retrieve(
      pendingPayment.stripeCheckoutSessionId
    );
    if (existingSession.status === "open" && existingSession.url) {
      if (pendingPayment.planId !== newPlan.id) {
        throw new Error("You already have a pending plan-change checkout. Complete or expire it before selecting another plan.");
      }
      return {
        paymentId: pendingPayment.id,
        sessionId: existingSession.id,
        checkoutUrl: existingSession.url,
      };
    }
    if (existingSession.status !== "expired") {
      throw new Error("Your previous plan-change payment is processing. Please wait before trying again.");
    }
    await markPaymentExpiredBySessionId(existingSession.id);
  }
  const payment = await createPayment({
    companyId,
    planId: newPlan.id,
    amount: planPrice,
    currency: "inr",
    purpose: "PLAN_CHANGE",
    planChangeForSubscriptionId: currentSubscription.id,
  });
  let sessionId: string | null = null;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: `${newPlan.name} - Plan Change`,
              description: newPlan.description ?? undefined,
            },
            unit_amount: amountInPaise,
          },
          quantity: 1,
        },
      ],
      client_reference_id: companyId,
      metadata: {
        paymentId: payment.id,
        companyId,
        planId: newPlan.id,
        purpose: "PLAN_CHANGE",
        planChangeForSubscriptionId: currentSubscription.id,
      },
    payment_intent_data: {
      metadata: {
        paymentId: payment.id,
        companyId,
        planId: newPlan.id,
        purpose: "PLAN_CHANGE",
        planChangeForSubscriptionId: currentSubscription.id,
      },
    },
      success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/payment/cancelled`,
    });
    if (!session.id || !session.url) {
      throw new Error("Failed to create Stripe Checkout Session");
    }
    sessionId = session.id;
    const linkedPayment = await updatePaymentCheckoutSessionId(payment.id, session.id);
    if (linkedPayment.count !== 1) {
      throw new Error(`Failed to link Checkout Session ${session.id} to payment ${payment.id}`);
    }
    return {
      paymentId: payment.id,
      sessionId: session.id,
      checkoutUrl: session.url,
    };
  } catch (error) {
    if (sessionId) {
      try {
        await stripe.checkout.sessions.expire(sessionId);
      } catch (expireError) {
        console.error("Failed to expire orphaned plan-change checkout:", {
          sessionId,
          expireError,
        });
      }
    }
    await prisma.payment.updateMany({
      where: {
        id: payment.id,
        status: "PENDING",
      },
      data: {
        status: "FAILED",
      },
  });
    throw error;
  }
};