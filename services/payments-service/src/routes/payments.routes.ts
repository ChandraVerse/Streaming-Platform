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

export const paymentsRoutes = router;

