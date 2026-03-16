import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { SubscriptionModel } from "../models/subscription.model.js";
import { UserModel } from "../models/user.model.js";

const router = Router();

const addProfileSchema = z.object({
  name: z.string().min(1).max(32),
  isKids: z.boolean().optional().default(false)
});

router.get("/me", requireAuth, async (request: AuthenticatedRequest, response) => {
  const user = await UserModel.findById(request.auth?.userId);
  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  const subscription = await SubscriptionModel.findOne({ userId: user.id });
  response.json({
    data: {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      referralCode: user.referralCode,
      profiles: user.profiles.map((profile) => ({
        id: profile._id?.toString() ?? "",
        name: profile.name,
        isKids: profile.isKids
      })),
      subscription: subscription ? { status: subscription.status, planId: subscription.planId } : undefined
    }
  });
});

router.post("/profiles", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = addProfileSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const user = await UserModel.findById(request.auth?.userId);
  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }

  if (user.profiles.length >= 5) {
    response.status(400).json({ message: "Profile limit reached" });
    return;
  }

  user.profiles.push(parsed.data);
  await user.save();

  response.status(201).json({
    message: "Profile added",
    data: {
      profiles: user.profiles.map((profile) => ({
        id: profile._id?.toString() ?? "",
        name: profile.name,
        isKids: profile.isKids
      }))
    }
  });
});

export const userRoutes = router;
