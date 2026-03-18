import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { SubscriptionModel, SUBSCRIPTION_PLANS } from "../models/subscription.model.js";
import { UserModel } from "../models/user.model.js";
import { ReferralModel } from "../models/referral.model.js";
import { env } from "../config/env.js";

const router = Router();

const subscribeSchema = z.object({
  planId: z.enum(["mobile", "standard", "premium"]),
  referralCode: z.string().optional()
});

const paymentsActivateSchema = z.object({
  userId: z.string().min(1),
  planId: z.enum(["mobile", "standard", "premium"])
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
});

router.post("/activate-from-payments", async (request, response) => {
  const secret = request.headers["x-payments-secret"];
  if (!env.PAYMENTS_WEBHOOK_SECRET || secret !== env.PAYMENTS_WEBHOOK_SECRET) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const parsed = paymentsActivateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const user = await UserModel.findById(parsed.data.userId);
  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  const subscription = await SubscriptionModel.findOneAndUpdate(
    { userId: user.id },
    {
      userId: user.id,
      planId: parsed.data.planId,
      status: "active",
      startedAt: new Date()
    },
    { upsert: true, new: true }
  );

  response.json({
    message: "Subscription activated via payments",
    data: {
      planId: subscription.planId,
      status: subscription.status
    }
  });
});

export const subscriptionRoutes = router;
