import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth.middleware.js";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware.js";
import { RentalModel } from "../models/rental.model.js";

const router = Router();

const purchaseSchema = z.object({
  contentId: z.string().min(1),
  windowHours: z.number().int().positive().optional().default(48)
});

router.post("/purchase", requireAuth, async (request: AuthenticatedRequest, response) => {
  const parsed = purchaseSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const userId = request.auth?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const startsAt = new Date();
  const endsAt = new Date(Date.now() + parsed.data.windowHours * 60 * 60 * 1000);
  const rental = await RentalModel.create({
    userId,
    contentId: parsed.data.contentId,
    startsAt,
    endsAt,
    status: "active"
  });
  response.status(201).json({
    message: "Rental activated",
    data: {
      id: rental.id,
      endsAt: rental.endsAt
    }
  });
});

router.get("/", requireAuth, async (request: AuthenticatedRequest, response) => {
  const userId = request.auth?.userId;
  if (!userId) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const rentals = await RentalModel.find({ userId }).sort({ createdAt: -1 });
  response.json({
    data: rentals.map((rental) => ({
      id: rental.id,
      contentId: rental.contentId,
      endsAt: rental.endsAt,
      status: rental.status
    }))
  });
});

export const rentalRoutes = router;
