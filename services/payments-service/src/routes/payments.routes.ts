import type { Request, Response } from "express";
import { Router } from "express";
import Razorpay from "razorpay";
import Stripe from "stripe";
import { z } from "zod";
import { env } from "../config/env.js";

const router = Router();

const stripeClient = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" }) : undefined;

const razorpayClient =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET
      })
    : undefined;

const createSessionSchema = z.object({
  userId: z.string().min(1),
  planId: z.string().min(1),
  priceInr: z.number().int().positive()
});

router.post("/stripe/checkout-session", async (request, response) => {
  if (!stripeClient) {
    response.status(503).json({ message: "Stripe not configured" });
    return;
  }

  const parsed = createSessionSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const session = await stripeClient.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          unit_amount: parsed.data.priceInr * 100,
          product_data: {
            name: `OTT plan ${parsed.data.planId}`
          },
          recurring: {
            interval: "month"
          }
        },
        quantity: 1
      }
    ],
    metadata: {
      userId: parsed.data.userId,
      planId: parsed.data.planId
    },
    success_url: "https://example.com/payments/success",
    cancel_url: "https://example.com/payments/cancel"
  });

  response.status(201).json({
    message: "Stripe checkout session created",
    data: {
      id: session.id,
      url: session.url
    }
  });
});

router.post("/razorpay/order", async (request, response) => {
  if (!razorpayClient) {
    response.status(503).json({ message: "Razorpay not configured" });
    return;
  }

  const parsed = createSessionSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const order = await razorpayClient.orders.create({
    amount: parsed.data.priceInr * 100,
    currency: "INR",
    receipt: `ott-${parsed.data.userId}-${parsed.data.planId}`,
    notes: {
      planId: parsed.data.planId
    }
  });

  response.status(201).json({
    message: "Razorpay order created",
    data: {
      id: order.id,
      amount: order.amount,
      currency: order.currency
    }
  });
});

const upiIntentSchema = z.object({
  vpa: z.string().min(3),
  amountInr: z.number().int().positive(),
  note: z.string().optional()
});

router.post("/upi/intent", (request, response) => {
  const parsed = upiIntentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(parsed.data.vpa)}&am=${parsed.data.amountInr}&tn=${encodeURIComponent(
    parsed.data.note ?? "OTT subscription"
  )}`;

  response.json({
    message: "UPI intent generated",
    data: {
      link: upiLink
    }
  });
});

router.post("/stripe/webhook", async (request: Request, response: Response) => {
  if (!stripeClient || !env.STRIPE_WEBHOOK_SECRET) {
    response.status(503).json({ message: "Stripe webhook not configured" });
    return;
  }

  const sig = request.headers["stripe-signature"];
  if (!sig) {
    response.status(400).json({ message: "Missing Stripe signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    const payloadString = JSON.stringify(request.body);
    event = stripeClient.webhooks.constructEvent(payloadString, sig as string, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    response.status(400).json({ message: "Invalid Stripe signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata ?? {};
    const userId = metadata.userId;
    const planId = metadata.planId as "mobile" | "standard" | "premium" | undefined;
    if (userId && planId) {
      await activateSubscriptionFromPayments(userId, planId);
    }
  }

  response.json({ received: true });
});

router.post("/razorpay/webhook", async (request: Request, response: Response) => {
  if (!razorpayClient || !env.RAZORPAY_WEBHOOK_SECRET) {
    response.status(503).json({ message: "Razorpay webhook not configured" });
    return;
  }

  const signature = request.headers["x-razorpay-signature"];
  if (!signature) {
    response.status(400).json({ message: "Missing Razorpay signature" });
    return;
  }

  const bodyString = JSON.stringify(request.body);
  const expectedSignature = Razorpay.validateWebhookSignature(
    bodyString,
    signature as string,
    env.RAZORPAY_WEBHOOK_SECRET
  );
  if (!expectedSignature) {
    response.status(400).json({ message: "Invalid Razorpay signature" });
    return;
  }

  const event = request.body as {
    event: string;
    payload?: {
      payment?: { entity?: { notes?: { userId?: string; planId?: string } } };
      order?: { entity?: { notes?: { userId?: string; planId?: string } } };
    };
  };

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const notes =
      event.payload?.payment?.entity?.notes ??
      event.payload?.order?.entity?.notes ??
      {};
    const userId = notes.userId;
    const planId = notes.planId as "mobile" | "standard" | "premium" | undefined;
    if (userId && planId) {
      await activateSubscriptionFromPayments(userId, planId);
    }
  }

  response.json({ received: true });
});

async function activateSubscriptionFromPayments(
  userId: string,
  planId: "mobile" | "standard" | "premium"
) {
  const url = `${env.AUTH_SERVICE_URL}/subscriptions/activate-from-payments`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-payments-secret": env.PAYMENTS_WEBHOOK_SECRET ?? ""
    },
    body: JSON.stringify({ userId, planId })
  });
}

export const paymentsRoutes = router;
