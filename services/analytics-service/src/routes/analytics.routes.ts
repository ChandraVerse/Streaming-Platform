import { Router } from "express";
import { z } from "zod";
import { EventModel } from "../models/event.model.js";

const router = Router();

const ingestSchema = z.object({
  userId: z.string().optional(),
  contentId: z.string().optional(),
  positionSeconds: z.number().int().nonnegative().optional(),
  durationSeconds: z.number().int().positive().optional(),
  kind: z.enum(["play", "pause", "complete", "signup", "subscription_activated"])
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

export const analyticsRoutes = router;
