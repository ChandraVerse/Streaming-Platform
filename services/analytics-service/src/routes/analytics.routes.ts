import { Router } from "express";
import { z } from "zod";
import { EventModel } from "../models/event.model.js";
import { RecommendationModel } from "../models/recommendation.model.js";
import { ExperimentModel } from "../models/experiment.model.js";
import { ExperimentAssignmentModel } from "../models/experiment-assignment.model.js";
import { env } from "../config/env.js";

const router = Router();

const ingestSchema = z.object({
  userId: z.string().optional(),
  contentId: z.string().optional(),
  positionSeconds: z.number().int().nonnegative().optional(),
  durationSeconds: z.number().int().positive().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  kind: z.enum([
    "play",
    "pause",
    "complete",
    "signup",
    "subscription_activated",
    "rating",
    "ad_impression",
    "ad_click",
    "live_join"
  ])
});

router.post("/events", async (request, response) => {
  const parsed = ingestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const event = await EventModel.create(parsed.data);
  response.status(201).json({
    message: "Event recorded",
    data: {
      id: event.id
    }
  });
});

router.get("/summary", async (_request, response) => {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [recentEvents, totals] = await Promise.all([
    EventModel.countDocuments({ createdAt: { $gte: dayAgo } }),
    EventModel.aggregate([
      {
        $group: {
          _id: "$kind",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  response.json({
    data: {
      eventsLast24h: recentEvents,
      byKind: totals.map((entry) => ({
        kind: entry._id as string,
        count: entry.count as number
      }))
    }
  });
});

router.get("/trending", async (request, response) => {
  const windowHoursParam = request.query.windowHours;
  const windowHours = windowHoursParam ? Number(windowHoursParam) || 24 : 24;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  const results = await EventModel.aggregate([
    {
      $match: {
        createdAt: { $gte: windowStart },
        contentId: { $exists: true, $ne: null },
        kind: { $in: ["play", "complete"] }
      }
    },
    {
      $group: {
        _id: "$contentId",
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        count: -1
      }
    },
    {
      $limit: 10
    }
  ]);

  response.json({
    data: results.map((entry) => ({
      contentId: entry._id as string,
      playCount: entry.count as number
    }))
  });
});

router.get("/continue-watching", async (request, response) => {
  const userId = String(request.query.userId ?? "");
  if (!userId) {
    response.json({ data: [] });
    return;
  }

  const results = await EventModel.aggregate([
    {
      $match: {
        userId,
        contentId: { $exists: true, $ne: null },
        kind: { $in: ["play", "pause", "complete"] }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: "$contentId",
        lastEvent: { $first: "$$ROOT" }
      }
    },
    {
      $match: {
        "lastEvent.kind": { $ne: "complete" }
      }
    },
    {
      $sort: {
        "lastEvent.createdAt": -1
      }
    },
    {
      $limit: 10
    }
  ]);

  response.json({
    data: results.map((entry) => ({
      contentId: (entry.lastEvent.contentId ?? "") as string,
      lastPlayedAt: entry.lastEvent.createdAt as Date,
      positionSeconds: (entry.lastEvent.positionSeconds ?? null) as number | null,
      durationSeconds: (entry.lastEvent.durationSeconds ?? null) as number | null
    }))
  });
});

router.get("/history", async (request, response) => {
  const userId = String(request.query.userId ?? "");
  if (!userId) {
    response.json({ data: [] });
    return;
  }

  const results = await EventModel.aggregate([
    {
      $match: {
        userId,
        contentId: { $exists: true, $ne: null },
        kind: { $in: ["play", "pause", "complete"] }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: "$contentId",
        lastEvent: { $first: "$$ROOT" }
      }
    },
    {
      $match: {
        "lastEvent.kind": "complete"
      }
    },
    {
      $sort: {
        "lastEvent.createdAt": -1
      }
    },
    {
      $limit: 20
    }
  ]);

  response.json({
    data: results.map((entry) => ({
      contentId: (entry.lastEvent.contentId ?? "") as string,
      completedAt: entry.lastEvent.createdAt as Date
    }))
  });
});

router.get("/recommendations/personalized", async (request, response) => {
  const userId = String(request.query.userId ?? "");
  const limit = Number(request.query.limit ?? 10) || 10;
  if (!userId) {
    response.json({ data: [] });
    return;
  }
  const cached = await RecommendationModel.findOne({ userId });
  if (cached && cached.contentIds.length > 0) {
    response.json({ data: cached.contentIds.slice(0, limit).map((contentId) => ({ contentId })) });
    return;
  }
  const watched = await EventModel.distinct("contentId", {
    userId,
    contentId: { $exists: true, $ne: null },
    kind: { $in: ["play", "complete"] }
  });
  if (watched.length === 0) {
    response.json({ data: [] });
    return;
  }
  const similarUsers = await EventModel.aggregate([
    {
      $match: {
        contentId: { $in: watched },
        userId: { $ne: userId },
        kind: { $in: ["play", "complete"] }
      }
    },
    {
      $group: {
        _id: "$userId",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 50 }
  ]);
  const similarUserIds = similarUsers.map((entry) => entry._id as string).filter(Boolean);
  if (similarUserIds.length === 0) {
    response.json({ data: [] });
    return;
  }
  const recs = await EventModel.aggregate([
    {
      $match: {
        userId: { $in: similarUserIds },
        contentId: { $nin: watched },
        kind: { $in: ["play", "complete"] }
      }
    },
    {
      $group: {
        _id: "$contentId",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
  const contentIds = recs.map((entry) => entry._id as string).filter(Boolean);
  await RecommendationModel.updateOne({ userId }, { userId, contentIds }, { upsert: true });
  response.json({ data: contentIds.map((contentId) => ({ contentId })) });
});

router.get("/recommendations/related", async (request, response) => {
  const contentId = String(request.query.contentId ?? "");
  const limit = Number(request.query.limit ?? 10) || 10;
  if (!contentId) {
    response.json({ data: [] });
    return;
  }
  const related = await EventModel.aggregate([
    {
      $match: {
        contentId,
        kind: { $in: ["play", "complete"] }
      }
    },
    {
      $group: {
        _id: "$userId"
      }
    },
    {
      $lookup: {
        from: "events",
        localField: "_id",
        foreignField: "userId",
        as: "events"
      }
    },
    { $unwind: "$events" },
    {
      $match: {
        "events.contentId": { $ne: contentId },
        "events.kind": { $in: ["play", "complete"] }
      }
    },
    {
      $group: {
        _id: "$events.contentId",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
  response.json({
    data: related.map((entry) => ({
      contentId: entry._id as string
    }))
  });
});

router.get("/activity-feed", async (request, response) => {
  const userId = String(request.query.userId ?? "");
  if (!userId) {
    response.json({ data: [] });
    return;
  }
  let followees: string[] = [];
  try {
    const followRes = await fetch(`${env.AUTH_SERVICE_URL}/social/following/internal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": env.INTERNAL_API_SECRET
      },
      body: JSON.stringify({ userId })
    });
    if (followRes.ok) {
      const payload = (await followRes.json()) as { data: { userId: string }[] };
      followees = payload.data.map((entry) => entry.userId);
    }
  } catch {
  }
  if (followees.length === 0) {
    response.json({ data: [] });
    return;
  }
  try {
    const userSummaryRes = await fetch(
      `${env.AUTH_SERVICE_URL}/users/summary?ids=${encodeURIComponent(followees.join(","))}`
    );
    if (userSummaryRes.ok) {
      const summaryPayload = (await userSummaryRes.json()) as { data: { userId: string; activityVisibility?: string }[] };
      const allowed = summaryPayload.data
        .filter((user) => user.activityVisibility !== "private")
        .map((user) => user.userId);
      followees = allowed;
    }
  } catch {
  }
  if (followees.length === 0) {
    response.json({ data: [] });
    return;
  }
  const events = await EventModel.find({
    userId: { $in: followees },
    kind: { $in: ["play", "complete", "rating", "live_join"] }
  })
    .sort({ createdAt: -1 })
    .limit(50);
  response.json({
    data: events.map((event) => ({
      id: event.id,
      userId: event.userId,
      contentId: event.contentId,
      kind: event.kind,
      rating: event.rating,
      createdAt: event.createdAt
    }))
  });
});

router.get("/notifications", async (request, response) => {
  const userId = String(request.query.userId ?? "");
  if (!userId) {
    response.json({ data: [] });
    return;
  }
  let followees: string[] = [];
  try {
    const followRes = await fetch(`${env.AUTH_SERVICE_URL}/social/following/internal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": env.INTERNAL_API_SECRET
      },
      body: JSON.stringify({ userId })
    });
    if (followRes.ok) {
      const payload = (await followRes.json()) as { data: { userId: string }[] };
      followees = payload.data.map((entry) => entry.userId);
    }
  } catch {
  }
  if (followees.length === 0) {
    response.json({ data: [] });
    return;
  }
  try {
    const userSummaryRes = await fetch(
      `${env.AUTH_SERVICE_URL}/users/summary?ids=${encodeURIComponent(followees.join(","))}`
    );
    if (userSummaryRes.ok) {
      const summaryPayload = (await userSummaryRes.json()) as { data: { userId: string; activityVisibility?: string }[] };
      const allowed = summaryPayload.data
        .filter((user) => user.activityVisibility !== "private")
        .map((user) => user.userId);
      followees = allowed;
    }
  } catch {
  }
  if (followees.length === 0) {
    response.json({ data: [] });
    return;
  }
  const events = await EventModel.find({
    userId: { $in: followees },
    kind: { $in: ["complete", "rating"] }
  })
    .sort({ createdAt: -1 })
    .limit(10);
  response.json({
    data: events.map((event) => ({
      id: event.id,
      userId: event.userId,
      contentId: event.contentId,
      kind: event.kind,
      rating: event.rating,
      createdAt: event.createdAt
    }))
  });
});

const experimentSchema = z.object({
  name: z.string().min(1),
  variants: z.array(z.string().min(1)).min(2),
  trafficSplit: z.array(z.number().min(0)).min(2),
  isActive: z.boolean().optional().default(true)
});

router.get("/experiments", async (_request, response) => {
  const experiments = await ExperimentModel.find().sort({ createdAt: -1 });
  response.json({
    data: experiments.map((experiment) => ({
      id: experiment.id,
      name: experiment.name,
      variants: experiment.variants,
      trafficSplit: experiment.trafficSplit,
      isActive: experiment.isActive
    }))
  });
});

router.post("/experiments", async (request, response) => {
  const parsed = experimentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const experiment = await ExperimentModel.create(parsed.data);
  response.status(201).json({ message: "Experiment created", data: { id: experiment.id } });
});

router.put("/experiments/:id", async (request, response) => {
  const parsed = experimentSchema.partial().safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const experiment = await ExperimentModel.findById(request.params.id);
  if (!experiment) {
    response.status(404).json({ message: "Experiment not found" });
    return;
  }
  Object.assign(experiment, parsed.data);
  await experiment.save();
  response.json({ message: "Experiment updated" });
});

router.post("/experiments/assign", async (request, response) => {
  const bodySchema = z.object({
    userId: z.string().min(1),
    experimentName: z.string().min(1)
  });
  const parsed = bodySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const experiment = await ExperimentModel.findOne({ name: parsed.data.experimentName, isActive: true });
  if (!experiment) {
    response.status(404).json({ message: "Experiment not found" });
    return;
  }
  const existing = await ExperimentAssignmentModel.findOne({
    userId: parsed.data.userId,
    experimentId: experiment.id
  });
  if (existing) {
    response.json({ data: { variant: existing.variant } });
    return;
  }
  const total = experiment.trafficSplit.reduce((sum, value) => sum + value, 0) || 1;
  const rand = Math.random() * total;
  let cumulative = 0;
  let chosen = experiment.variants[0];
  for (let i = 0; i < experiment.variants.length; i += 1) {
    cumulative += experiment.trafficSplit[i] ?? 0;
    if (rand <= cumulative) {
      chosen = experiment.variants[i];
      break;
    }
  }
  const assignment = await ExperimentAssignmentModel.create({
    userId: parsed.data.userId,
    experimentId: experiment.id,
    variant: chosen
  });
  response.json({ data: { variant: assignment.variant } });
});

router.get("/experiments/assignments", async (request, response) => {
  const userId = String(request.query.userId ?? "");
  if (!userId) {
    response.json({ data: [] });
    return;
  }
  const assignments = await ExperimentAssignmentModel.find({ userId });
  response.json({
    data: assignments.map((assignment) => ({
      experimentId: assignment.experimentId.toString(),
      variant: assignment.variant
    }))
  });
});

router.get("/experiments/results", async (request, response) => {
  const name = String(request.query.name ?? "");
  if (!name) {
    response.status(400).json({ message: "name is required" });
    return;
  }
  const experiment = await ExperimentModel.findOne({ name });
  if (!experiment) {
    response.status(404).json({ message: "Experiment not found" });
    return;
  }
  const results = await ExperimentAssignmentModel.aggregate([
    { $match: { experimentId: experiment._id } },
    { $group: { _id: "$variant", count: { $sum: 1 } } }
  ]);
  response.json({
    data: results.map((entry) => ({
      variant: entry._id as string,
      count: entry.count as number
    }))
  });
});

router.get("/cohorts", async (_request, response) => {
  const now = new Date();
  const start = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  const signups = await EventModel.aggregate([
    {
      $match: {
        kind: "signup",
        createdAt: { $gte: start }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          week: { $isoWeek: "$createdAt" }
        },
        users: { $addToSet: "$userId" },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } }
  ]);
  response.json({
    data: signups.map((entry) => ({
      cohort: `${entry._id.year}-W${entry._id.week}`,
      signups: entry.count as number,
      users: entry.users as string[]
    }))
  });
});

router.get("/content-performance", async (_request, response) => {
  const stats = await EventModel.aggregate([
    {
      $match: {
        contentId: { $exists: true, $ne: null },
        kind: { $in: ["play", "complete"] }
      }
    },
    {
      $group: {
        _id: "$contentId",
        plays: {
          $sum: {
            $cond: [{ $eq: ["$kind", "play"] }, 1, 0]
          }
        },
        completes: {
          $sum: {
            $cond: [{ $eq: ["$kind", "complete"] }, 1, 0]
          }
        }
      }
    },
    { $sort: { completes: -1 } },
    { $limit: 20 }
  ]);
  response.json({
    data: stats.map((entry) => ({
      contentId: entry._id as string,
      plays: entry.plays as number,
      completes: entry.completes as number,
      completionRate: entry.plays ? entry.completes / entry.plays : 0
    }))
  });
});

export const analyticsRoutes = router;
