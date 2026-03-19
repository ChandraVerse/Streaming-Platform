import { Router } from "express";
import { z } from "zod";
import { CampaignModel } from "../models/campaign.model.js";

const router = Router();

const campaignSchema = z.object({
  name: z.string().min(1),
  placement: z.enum(["hero", "row", "banner"]),
  contentIds: z.array(z.string()).optional().default([]),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  priority: z.number().int().default(0),
  isActive: z.boolean().optional().default(true)
});

router.post("/", async (request, response) => {
  const parsed = campaignSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const campaign = await CampaignModel.create(parsed.data);
  response.status(201).json({ message: "Campaign created", data: { id: campaign.id } });
});

router.get("/", async (_request, response) => {
  const campaigns = await CampaignModel.find().sort({ createdAt: -1 });
  response.json({
    data: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      placement: campaign.placement,
      contentIds: campaign.contentIds.map((id) => id.toString()),
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      priority: campaign.priority,
      isActive: campaign.isActive
    }))
  });
});

router.get("/active", async (request, response) => {
  const placement = String(request.query.placement ?? "");
  const now = new Date();
  const query: Record<string, unknown> = {
    isActive: true,
    startsAt: { $lte: now },
    endsAt: { $gte: now }
  };
  if (placement) {
    query.placement = placement;
  }
  const campaigns = await CampaignModel.find(query).sort({ priority: -1, startsAt: 1 });
  response.json({
    data: campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      placement: campaign.placement,
      contentIds: campaign.contentIds.map((id) => id.toString())
    }))
  });
});

router.put("/:id", async (request, response) => {
  const parsed = campaignSchema.partial().safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const campaign = await CampaignModel.findById(request.params.id);
  if (!campaign) {
    response.status(404).json({ message: "Campaign not found" });
    return;
  }
  Object.assign(campaign, parsed.data);
  await campaign.save();
  response.json({ message: "Campaign updated" });
});

export const campaignsRoutes = router;
