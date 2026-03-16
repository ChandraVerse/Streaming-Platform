import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { SubscriptionModel, SUBSCRIPTION_PLANS } from "../models/subscription.model.js";

const router = Router();

const subscribeSchema = z.object({
  planId: z.enum(["mobile", "standard", "premium"]),
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

  const subscription = await SubscriptionModel.findOneAndUpdate(
    { userId: request.auth?.userId },
    {
      userId: request.auth?.userId,
      planId: parsed.data.planId,
      status: "active",
      startedAt: new Date(),
      referralCode: parsed.data.referralCode
    },
    { upsert: true, new: true }
  );

  response.json({
    message: "Subscription activated",
    data: {
      planId: subscription.planId,
      status: subscription.status
    }
  });
});

export const subscriptionRoutes = router;
