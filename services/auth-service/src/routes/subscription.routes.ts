import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { SubscriptionModel, SUBSCRIPTION_PLANS } from "../models/subscription.model.js";
import { UserModel } from "../models/user.model.js";
import { ReferralModel } from "../models/referral.model.js";
import { AuditLogModel } from "../models/audit-log.model.js";
import { env } from "../config/env.js";

const router = Router();

const subscribeSchema = z.object({
  planId: z.enum(["mobile", "standard", "premium", "ad-supported"]),
  referralCode: z.string().optional()
});

router.get("/plans", (_request, response) => {
  response.json({ data: SUBSCRIPTION_PLANS });
});

router.post("/activate", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = subscribeSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const userId = request.auth?.userId;
  const subscription = await SubscriptionModel.findOneAndUpdate(
    { userId },
    {
      userId,
      planId: parsed.data.planId,
      status: "active",
      startedAt: new Date(),
      referralCode: parsed.data.referralCode
    },
    { upsert: true, new: true }
  );

  if (parsed.data.referralCode && userId) {
    const referrer = await UserModel.findOne({ referralCode: parsed.data.referralCode });
    if (referrer && String(referrer.id) !== userId) {
      let referrerSubscription = await SubscriptionModel.findOne({ userId: referrer.id });
      const now = new Date();
      const monthMs = 30 * 24 * 60 * 60 * 1000;
      if (referrerSubscription) {
        const currentEnd = referrerSubscription.endsAt ?? referrerSubscription.startedAt;
        referrerSubscription.endsAt = new Date(currentEnd.getTime() + monthMs);
        await referrerSubscription.save();
      } else {
        referrerSubscription = await SubscriptionModel.create({
          userId: referrer.id,
          planId: subscription.planId,
          status: "active",
          startedAt: now,
          endsAt: new Date(now.getTime() + monthMs)
        });
      }

      referrer.referralCount = (referrer.referralCount ?? 0) + 1;
      await referrer.save();

      await ReferralModel.updateOne(
        { referrerId: referrer.id, refereeId: userId },
        { referrerId: referrer.id, refereeId: userId },
        { upsert: true }
      );
    }
  }

  response.json({
    message: "Subscription activated",
    data: {
      planId: subscription.planId,
      status: subscription.status
    }
  });
  try {
    await fetch(`${env.ANALYTICS_SERVICE_URL}/analytics/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        kind: "subscription_activated"
      })
    });
  } catch {
  }
  await AuditLogModel.create({
    actorId: userId,
    action: "subscription_activated",
    targetId: userId,
    metadata: { planId: subscription.planId }
  });
});

router.post("/activate-from-payments", async (request, response) => {
  const secret = request.headers["x-payments-secret"];
  if (secret !== env.PAYMENTS_WEBHOOK_SECRET) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const schema = z.object({
    userId: z.string().min(1),
    planId: z.enum(["mobile", "standard", "premium", "ad-supported"])
  });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const subscription = await SubscriptionModel.findOneAndUpdate(
    { userId: parsed.data.userId },
    {
      userId: parsed.data.userId,
      planId: parsed.data.planId,
      status: "active",
      startedAt: new Date()
    },
    { upsert: true, new: true }
  );
  await AuditLogModel.create({
    actorId: undefined,
    action: "payments_subscription_activated",
    targetId: parsed.data.userId,
    metadata: { planId: parsed.data.planId }
  });
  response.json({
    data: {
      planId: subscription.planId,
      status: subscription.status
    }
  });
});

export const subscriptionRoutes = router;
