import { Router } from "express";
import { z } from "zod";
import { AdSlotModel } from "../models/ad-slot.model.js";
import { AdCampaignModel } from "../models/ad-campaign.model.js";

const router = Router();

const slotSchema = z.object({
  name: z.string().min(1),
  placement: z.enum(["preroll", "midroll", "postroll"]),
  minDurationSeconds: z.number().int().positive().default(5),
  maxDurationSeconds: z.number().int().positive().default(30),
  isActive: z.boolean().optional().default(true)
});

router.post("/slots", async (request, response) => {
  const parsed = slotSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const slot = await AdSlotModel.create(parsed.data);
  response.status(201).json({ message: "Ad slot created", data: { id: slot.id } });
});

router.get("/slots", async (_request, response) => {
  const slots = await AdSlotModel.find().sort({ createdAt: -1 });
  response.json({
    data: slots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      placement: slot.placement,
      minDurationSeconds: slot.minDurationSeconds,
      maxDurationSeconds: slot.maxDurationSeconds,
      isActive: slot.isActive
    }))
  });
});

const campaignSchema = z.object({
  name: z.string().min(1),
  slotId: z.string().min(1),
  mediaUrl: z.string().url(),
  clickUrl: z.string().url().optional(),
  contentIds: z.array(z.string()).optional().default([]),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  weight: z.number().int().positive().default(1),
  isActive: z.boolean().optional().default(true)
});

router.post("/campaigns", async (request, response) => {
  const parsed = campaignSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const campaign = await AdCampaignModel.create(parsed.data);
  response.status(201).json({ message: "Ad campaign created", data: { id: campaign.id } });
});

router.get("/campaigns", async (_request, response) => {
  const campaigns = await AdCampaignModel.find().sort({ createdAt: -1 });
  response.json({
    data: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      slotId: campaign.slotId.toString(),
      mediaUrl: campaign.mediaUrl,
      clickUrl: campaign.clickUrl,
      contentIds: campaign.contentIds.map((id) => id.toString()),
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      weight: campaign.weight,
      isActive: campaign.isActive
    }))
  });
});

router.get("/decision", async (request, response) => {
  const placement = String(request.query.placement ?? "");
  if (!placement || !["preroll", "midroll", "postroll"].includes(placement)) {
    response.status(400).json({ message: "Invalid placement" });
    return;
  }
  const contentId = String(request.query.contentId ?? "");
  const now = new Date();
  const slots = await AdSlotModel.find({ placement, isActive: true });
  if (slots.length === 0) {
    response.json({ data: null });
    return;
  }
  const slotIds = slots.map((slot) => slot.id);
  const campaigns = await AdCampaignModel.find({
    slotId: { $in: slotIds },
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now },
    ...(contentId ? { $or: [{ contentIds: { $size: 0 } }, { contentIds: contentId }] } : {})
  });
  if (campaigns.length === 0) {
    response.json({ data: null });
    return;
  }
  const weighted = campaigns.flatMap((campaign) => Array.from({ length: Math.max(1, campaign.weight) }).map(() => campaign));
  const chosen = weighted[Math.floor(Math.random() * weighted.length)];
  response.json({
    data: {
      id: chosen.id,
      mediaUrl: chosen.mediaUrl,
      clickUrl: chosen.clickUrl,
      slotId: chosen.slotId.toString(),
      placement
    }
  });
});

export const adsRoutes = router;
