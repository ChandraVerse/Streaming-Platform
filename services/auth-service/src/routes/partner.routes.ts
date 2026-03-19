import { Router } from "express";
import { z } from "zod";
import { PartnerEntitlementModel } from "../models/partner-entitlement.model.js";
import { env } from "../config/env.js";

const router = Router();

const entitlementSchema = z.object({
  userId: z.string().min(1),
  partnerName: z.string().min(1),
  externalId: z.string().min(1),
  planId: z.string().optional(),
  expiresAt: z.coerce.date().optional()
});

router.post("/entitlements", async (request, response) => {
  const secret = request.headers["x-admin-secret"];
  if (secret !== env.ADMIN_API_SECRET) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const parsed = entitlementSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const entitlement = await PartnerEntitlementModel.findOneAndUpdate(
    {
      userId: parsed.data.userId,
      partnerName: parsed.data.partnerName,
      externalId: parsed.data.externalId
    },
    parsed.data,
    { upsert: true, new: true }
  );
  response.status(201).json({
    message: "Entitlement synced",
    data: {
      id: entitlement.id
    }
  });
});

router.get("/entitlements", async (request, response) => {
  const secret = request.headers["x-admin-secret"];
  if (secret !== env.ADMIN_API_SECRET) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }
  const userId = String(request.query.userId ?? "");
  const entitlements = await PartnerEntitlementModel.find(userId ? { userId } : {}).sort({ createdAt: -1 });
  response.json({
    data: entitlements.map((entitlement) => ({
      id: entitlement.id,
      userId: entitlement.userId.toString(),
      partnerName: entitlement.partnerName,
      externalId: entitlement.externalId,
      planId: entitlement.planId,
      expiresAt: entitlement.expiresAt
    }))
  });
});

export const partnerRoutes = router;
