import { Router } from "express";
import { z } from "zod";
import { RatingModel } from "../models/rating.model.js";
import { env } from "../config/env.js";

const router = Router();

const rateSchema = z.object({
  userId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional()
});

router.post("/:contentId", async (request, response) => {
  const parsed = rateSchema.safeParse({ ...request.body, userId: request.body.userId });
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const sanitizedReview = parsed.data.review
    ? parsed.data.review.replace(/<[^>]*>/g, "").slice(0, 1000)
    : undefined;
  const rating = await RatingModel.create({
    userId: parsed.data.userId,
    contentId: request.params.contentId,
    rating: parsed.data.rating,
    review: sanitizedReview
  });
  try {
    await fetch(`${env.ANALYTICS_SERVICE_URL}/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: parsed.data.userId,
        contentId: request.params.contentId,
        kind: "rating",
        rating: parsed.data.rating
      })
    });
  } catch {
  }

  response.status(201).json({
    message: "Rating recorded",
    data: {
      id: rating.id
    }
  });
});

router.get("/:contentId", async (request, response) => {
  const items = await RatingModel.find({ contentId: request.params.contentId }).sort({ createdAt: -1 }).limit(20);
  response.json({
    data: items.map((item) => ({
      id: item.id,
      userId: item.userId,
      rating: item.rating,
      review: item.review,
      createdAt: item.createdAt
    }))
  });
});

export const ratingRoutes = router;
