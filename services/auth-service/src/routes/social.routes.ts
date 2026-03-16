import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { FollowModel } from "../models/follow.model.js";
import { UserModel } from "../models/user.model.js";

const router = Router();

const followSchema = z.object({
  targetUserId: z.string().min(1)
});

router.post("/follow", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = followSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const followerId = request.auth?.userId;
  if (!followerId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (followerId === parsed.data.targetUserId) {
    response.status(400).json({ message: "Cannot follow yourself" });
    return;
  }

  const exists = await UserModel.exists({ _id: parsed.data.targetUserId });
  if (!exists) {
    response.status(404).json({ message: "Target user not found" });
    return;
  }

  await FollowModel.updateOne(
    { followerId, followeeId: parsed.data.targetUserId },
    { followerId, followeeId: parsed.data.targetUserId },
    { upsert: true }
  );

  response.status(204).end();
});

router.post("/unfollow", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = followSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const followerId = request.auth?.userId;
  if (!followerId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  await FollowModel.deleteOne({ followerId, followeeId: parsed.data.targetUserId });
  response.status(204).end();
});

router.get("/following", requireAuth, async (request: AuthenticatedRequest, response) => {
  const followerId = request.auth?.userId;
  if (!followerId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const follows = await FollowModel.find({ followerId });
  const users = await UserModel.find({ _id: { $in: follows.map((follow) => follow.followeeId) } });

  response.json({
    data: users.map((user) => ({
      userId: user.id,
      fullName: user.fullName,
      email: user.email
    }))
  });
});

router.get("/followers", requireAuth, async (request: AuthenticatedRequest, response) => {
  const followeeId = request.auth?.userId;
  if (!followeeId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  const follows = await FollowModel.find({ followeeId });
  const users = await UserModel.find({ _id: { $in: follows.map((follow) => follow.followerId) } });

  response.json({
    data: users.map((user) => ({
      userId: user.id,
      fullName: user.fullName,
      email: user.email
    }))
  });
});

export const socialRoutes = router;

