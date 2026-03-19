import { Router } from "express";
import { z } from "zod";
import { ChannelModel } from "../models/channel.model.js";
import { ScheduleModel } from "../models/schedule.model.js";
import { LiveEventModel } from "../models/live-event.model.js";
import { ContentModel } from "../models/content.model.js";

const router = Router();

const channelSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  timezone: z.string().min(1).default("UTC"),
  logoUrl: z.string().url().optional(),
  isSports: z.boolean().optional().default(false)
});

router.get("/channels", async (_request, response) => {
  const items = await ChannelModel.find().sort({ createdAt: -1 });
  response.json({
    data: items.map((channel) => ({
      id: channel.id,
      name: channel.name,
      slug: channel.slug,
      description: channel.description,
      timezone: channel.timezone,
      logoUrl: channel.logoUrl,
      isSports: channel.isSports
    }))
  });
});

router.post("/channels", async (request, response) => {
  const parsed = channelSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const existing = await ChannelModel.findOne({ slug: parsed.data.slug });
  if (existing) {
    response.status(409).json({ message: "Channel slug already exists" });
    return;
  }
  const channel = await ChannelModel.create(parsed.data);
  response.status(201).json({
    message: "Channel created",
    data: {
      id: channel.id
    }
  });
});

router.put("/channels/:id", async (request, response) => {
  const parsed = channelSchema.partial().safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const channel = await ChannelModel.findById(request.params.id);
  if (!channel) {
    response.status(404).json({ message: "Channel not found" });
    return;
  }
  if (parsed.data.slug && parsed.data.slug !== channel.slug) {
    const existing = await ChannelModel.findOne({ slug: parsed.data.slug });
    if (existing) {
      response.status(409).json({ message: "Channel slug already exists" });
      return;
    }
  }
  Object.assign(channel, parsed.data);
  await channel.save();
  response.json({ message: "Channel updated" });
});

const scheduleSchema = z.object({
  contentId: z.string().optional(),
  title: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  timezone: z.string().min(1).default("UTC")
});

router.get("/channels/:id/schedule", async (request, response) => {
  const channelId = request.params.id;
  const now = new Date();
  const items = await ScheduleModel.find({ channelId, endTime: { $gte: now } })
    .sort({ startTime: 1 })
    .limit(48);
  response.json({
    data: items.map((entry) => ({
      id: entry.id,
      channelId: entry.channelId.toString(),
      contentId: entry.contentId?.toString(),
      title: entry.title,
      startTime: entry.startTime,
      endTime: entry.endTime,
      timezone: entry.timezone,
      status: entry.startTime <= now && entry.endTime >= now ? "live" : entry.startTime > now ? "upcoming" : "ended"
    }))
  });
});

router.post("/channels/:id/schedule", async (request, response) => {
  const channelId = request.params.id;
  const parsed = scheduleSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const channel = await ChannelModel.findById(channelId);
  if (!channel) {
    response.status(404).json({ message: "Channel not found" });
    return;
  }
  const schedule = await ScheduleModel.create({
    channelId,
    contentId: parsed.data.contentId,
    title: parsed.data.title,
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    timezone: parsed.data.timezone,
    status: parsed.data.startTime <= new Date() && parsed.data.endTime >= new Date() ? "live" : "upcoming"
  });
  response.status(201).json({
    message: "Schedule created",
    data: { id: schedule.id }
  });
});

const eventSchema = z.object({
  contentId: z.string().min(1),
  channelId: z.string().optional(),
  homeTeam: z.string().min(1),
  awayTeam: z.string().min(1),
  homeScore: z.number().int().nonnegative().optional().default(0),
  awayScore: z.number().int().nonnegative().optional().default(0),
  period: z.string().optional().default(""),
  clock: z.string().optional().default(""),
  status: z.enum(["upcoming", "live", "final"]).default("upcoming")
});

router.get("/events", async (request, response) => {
  const contentId = String(request.query.contentId ?? "");
  if (!contentId) {
    response.json({ data: [] });
    return;
  }
  const event = await LiveEventModel.findOne({ contentId });
  if (!event) {
    response.json({ data: null });
    return;
  }
  response.json({
    data: {
      id: event.id,
      contentId: event.contentId.toString(),
      channelId: event.channelId?.toString(),
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      homeScore: event.homeScore,
      awayScore: event.awayScore,
      period: event.period,
      clock: event.clock,
      status: event.status
    }
  });
});

router.post("/events", async (request, response) => {
  const parsed = eventSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const content = await ContentModel.findById(parsed.data.contentId);
  if (!content) {
    response.status(404).json({ message: "Content not found" });
    return;
  }
  const existing = await LiveEventModel.findOne({ contentId: parsed.data.contentId });
  if (existing) {
    Object.assign(existing, parsed.data);
    await existing.save();
    response.json({ message: "Live event updated", data: { id: existing.id } });
    return;
  }
  const event = await LiveEventModel.create(parsed.data);
  response.status(201).json({ message: "Live event created", data: { id: event.id } });
});

router.get("/health", async (request, response) => {
  const contentId = String(request.query.contentId ?? "");
  if (!contentId) {
    response.status(400).json({ message: "contentId is required" });
    return;
  }
  const content = await ContentModel.findById(contentId);
  if (!content) {
    response.status(404).json({ message: "Content not found" });
    return;
  }
  const isHealthy = Boolean(content.livePlaybackId);
  response.json({
    data: {
      isHealthy,
      playbackId: content.livePlaybackId ?? content.muxPlaybackId ?? null,
      backupPlaybackId: content.liveBackupPlaybackId ?? null
    }
  });
});

export const liveRoutes = router;
