import { Router } from "express";
import { z } from "zod";
import { EventModel } from "../models/event.model.js";

const router = Router();

const ingestSchema = z.object({
  userId: z.string().optional(),
  contentId: z.string().optional(),
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

export const analyticsRoutes = router;

