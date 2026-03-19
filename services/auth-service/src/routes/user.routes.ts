import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { SubscriptionModel } from "../models/subscription.model.js";
import { ReferralModel } from "../models/referral.model.js";
import { UserModel } from "../models/user.model.js";
import { RentalModel } from "../models/rental.model.js";
import { AuditLogModel } from "../models/audit-log.model.js";
import { env } from "../config/env.js";

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
      activityVisibility: user.activityVisibility,
      notificationPreferences: user.notificationPreferences,
      subscription: subscription ? { status: subscription.status, planId: subscription.planId } : undefined
    }
  });
});

router.get("/me/referrals", requireAuth, async (request: AuthenticatedRequest, response) => {
  const userId = request.auth?.userId;
  const referrals = await ReferralModel.find({ referrerId: userId });
  const referees = await UserModel.find({ _id: { $in: referrals.map((entry) => entry.refereeId) } });

  response.json({
    data: {
      total: referrals.length,
      referees: referees.map((user) => ({
        userId: user.id,
        fullName: user.fullName,
        email: user.email
      }))
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

router.put("/activity-visibility", requireAuth, async (request: AuthenticatedRequest, response) => {
  const schema = z.object({ activityVisibility: z.enum(["public", "private"]) });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const user = await UserModel.findById(request.auth?.userId);
  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }
  user.activityVisibility = parsed.data.activityVisibility;
  await user.save();
  response.json({ message: "Visibility updated" });
});

router.put("/notification-preferences", requireAuth, async (request: AuthenticatedRequest, response) => {
  const schema = z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional()
  });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const user = await UserModel.findById(request.auth?.userId);
  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }
  user.notificationPreferences = {
    email: parsed.data.email ?? user.notificationPreferences?.email ?? true,
    push: parsed.data.push ?? user.notificationPreferences?.push ?? false,
    inApp: parsed.data.inApp ?? user.notificationPreferences?.inApp ?? true
  };
  await user.save();
  response.json({ message: "Preferences updated" });
});

router.get("/summary", async (request, response) => {
  const idsParam = String(request.query.ids ?? "");
  const ids = idsParam
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (ids.length === 0) {
    response.json({ data: [] });
    return;
  }
  const users = await UserModel.find({ _id: { $in: ids } });
  response.json({
    data: users.map((user) => ({
      userId: user.id,
      fullName: user.fullName,
      activityVisibility: user.activityVisibility
    }))
  });
});

router.get("/search", async (request, response) => {
  const secret = request.headers["x-admin-secret"];
  if (secret !== env.ADMIN_API_SECRET) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const query = String(request.query.query ?? "").trim();
  if (!query) {
    response.json({ data: [] });
    return;
  }
  const users = await UserModel.find({
    $or: [
      { email: new RegExp(query, "i") },
      { fullName: new RegExp(query, "i") }
    ]
  }).limit(20);
  response.json({
    data: users.map((user) => ({
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      activityVisibility: user.activityVisibility
    }))
  });
});

router.post("/reset-access", async (request, response) => {
  const secret = request.headers["x-admin-secret"];
  if (secret !== env.ADMIN_API_SECRET) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const schema = z.object({ userId: z.string().min(1) });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const user = await UserModel.findById(parsed.data.userId);
  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }
  user.refreshToken = undefined;
  await user.save();
  await RentalModel.updateMany({ userId: user.id }, { status: "cancelled" });
  await AuditLogModel.create({
    actorId: undefined,
    action: "reset_access",
    targetId: user.id
  });
  response.json({ message: "Access reset" });
});

router.get("/admin/:id", async (request, response) => {
  const secret = request.headers["x-admin-secret"];
  if (secret !== env.ADMIN_API_SECRET) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const user = await UserModel.findById(request.params.id);
  if (!user) {
    response.status(404).json({ message: "User not found" });
    return;
  }
  const subscription = await SubscriptionModel.findOne({ userId: user.id });
  const rentals = await RentalModel.find({ userId: user.id });
  response.json({
    data: {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      activityVisibility: user.activityVisibility,
      subscription: subscription ? { status: subscription.status, planId: subscription.planId } : undefined,
      rentals: rentals.map((rental) => ({
        id: rental.id,
        contentId: rental.contentId,
        endsAt: rental.endsAt,
        status: rental.status
      }))
    }
  });
});

export const userRoutes = router;
