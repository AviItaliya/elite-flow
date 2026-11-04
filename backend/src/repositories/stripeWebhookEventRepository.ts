import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";

const CLAIM_DURATION_MS = 10 * 60 * 1000;

interface ClaimEventInput {
  stripeEventId: string;
  eventType: string;
}

interface ClaimEventResult {
  claimed: boolean;
  alreadyProcessed: boolean;
  claimToken: string | null;
}

const isPrismaUniqueError = (error: unknown): boolean => {
  return (typeof error === "object" && error !== null && "code" in error && error.code === "P2002");
};

export const claimStripeWebhookEvent = async ({stripeEventId, eventType}: ClaimEventInput): Promise<ClaimEventResult> => {
  const now = new Date();
  const claimedUntil = new Date(now.getTime() + CLAIM_DURATION_MS);
  const claimToken = randomUUID();

  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId,
        eventType,
        status: "PROCESSING",
        attempts: 1,
        claimedUntil,
        claimToken,
      },
    });

    return {
      claimed: true,
      alreadyProcessed: false,
      claimToken,
    };
  } catch (error) {
    if (!isPrismaUniqueError(error)) {
      throw error;
    }
  }

  const existingEvent = await prisma.stripeWebhookEvent.findUnique({
    where: { stripeEventId },
  });

  if (!existingEvent) {
    throw new Error("Webhook event record could not be found");
  }

  if (existingEvent.status === "PROCESSED") {
    return {
      claimed: false,
      alreadyProcessed: true,
      claimToken: null,
    };
  }

  const reclaimedEvent = await prisma.stripeWebhookEvent.updateMany({
    where: {
      stripeEventId,
      OR: [
        { status: "FAILED" },
        { status: "RECEIVED" },
        { status: "PROCESSING", claimedUntil: { lt: now } },
      ],
    },
    data: {
      status: "PROCESSING",
      attempts: { increment: 1 },
      claimedUntil,
      claimToken,
      lastError: null,
    },
  });

  if (reclaimedEvent.count === 1) {
    return {
      claimed: true,
      alreadyProcessed: false,
      claimToken,
    };
  }

  return {
    claimed: false,
    alreadyProcessed: false,
    claimToken: null,
  };
};

export const markStripeWebhookEventProcessed = async (stripeEventId: string, claimToken: string): Promise<void> => {
  const result = await prisma.stripeWebhookEvent.updateMany({
    where: {
      stripeEventId,
      status: "PROCESSING",
      claimToken,
    },
    data: {
      status: "PROCESSED",
      processedAt: new Date(),
      claimedUntil: null,
      claimToken: null,
      lastError: null,
    },
  });
  if (result.count !== 1) {
    throw new Error("Webhook claim ownership was lost before processing completed");
  }
};

export const markStripeWebhookEventFailed = async (stripeEventId: string, claimToken: string, errorMessage: string): Promise<void> => {
  const result = await prisma.stripeWebhookEvent.updateMany({
    where: {
      stripeEventId,
      status: "PROCESSING",
      claimToken,
    },
    data: {
      status: "FAILED",
      claimedUntil: null,
      claimToken: null,
      lastError: errorMessage.slice(0, 5000),
    },
  });
  if (result.count !== 1) {
    console.warn("Webhook failure status was not updated because claim ownership was lost:", stripeEventId);
  }
};