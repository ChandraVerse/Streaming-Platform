import { Router } from "express";
import { z } from "zod";
import { ContentModel } from "../models/content.model.js";
import { muxVideo } from "../mux/client.js";

const router = Router();

const attachSchema = z.object({
  contentId: z.string().min(1),
  assetId: z.string().min(1),
  playbackId: z.string().min(1)
});

router.post("/attach-asset", async (request, response) => {
  const parsed = attachSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const content = await ContentModel.findById(parsed.data.contentId);
  if (!content) {
    response.status(404).json({ message: "Content not found" });
    return;
  }

  content.mainAssetId = parsed.data.assetId;
  content.muxPlaybackId = parsed.data.playbackId;
  await content.save();

  response.json({
    message: "Mux asset attached",
    data: {
      id: content.id,
      muxPlaybackId: content.muxPlaybackId
    }
  });
});

router.post("/create-asset", async (request, response) => {
  if (!muxVideo) {
    response.status(503).json({ message: "Mux not configured" });
    return;
  }

  const bodySchema = z.object({
    inputUrl: z.string().url().min(1)
  });
  const parsed = bodySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const asset = await muxVideo.assets.create({
    input: [{ url: parsed.data.inputUrl }],
    playback_policy: ["public"]
  });

  response.status(201).json({
    message: "Mux asset created",
    data: {
      assetId: asset.id,
      playbackIds: asset.playback_ids?.map((playback: { id: string }) => playback.id) ?? []
    }
  });
});

const liveSchema = z.object({
  contentId: z.string().min(1),
  playbackPolicy: z.enum(["public", "signed"]).optional().default("public")
});

router.post("/create-live", async (request, response) => {
  if (!muxVideo) {
    response.status(503).json({ message: "Mux not configured" });
    return;
  }
  const parsed = liveSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const content = await ContentModel.findById(parsed.data.contentId);
  if (!content) {
    response.status(404).json({ message: "Content not found" });
    return;
  }
  const stream = await muxVideo.liveStreams.create({
    playback_policy: [parsed.data.playbackPolicy],
    new_asset_settings: { playback_policy: [parsed.data.playbackPolicy] }
  });
  const playbackId = stream.playback_ids?.[0]?.id ?? "";
  content.liveStreamId = stream.id;
  content.livePlaybackId = playbackId || content.livePlaybackId;
  await content.save();
  response.status(201).json({
    message: "Mux live stream created",
    data: {
      streamId: stream.id,
      playbackId,
      streamKey: stream.stream_key
    }
  });
});

router.post("/attach-live", async (request, response) => {
  const bodySchema = z.object({
    contentId: z.string().min(1),
    streamId: z.string().min(1),
    playbackId: z.string().min(1)
  });
  const parsed = bodySchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const content = await ContentModel.findById(parsed.data.contentId);
  if (!content) {
    response.status(404).json({ message: "Content not found" });
    return;
  }
  content.liveStreamId = parsed.data.streamId;
  content.livePlaybackId = parsed.data.playbackId;
  await content.save();
  response.json({ message: "Mux live stream attached" });
});

router.get("/live/:id", async (request, response) => {
  if (!muxVideo) {
    response.status(503).json({ message: "Mux not configured" });
    return;
  }
  const stream = await muxVideo.liveStreams.retrieve(request.params.id);
  response.json({
    data: {
      id: stream.id,
      status: stream.status,
      playbackIds: stream.playback_ids?.map((playback: { id: string }) => playback.id) ?? [],
      recentAssetIds: stream.recent_asset_ids ?? []
    }
  });
});

router.post("/live/:id/disable", async (request, response) => {
  if (!muxVideo) {
    response.status(503).json({ message: "Mux not configured" });
    return;
  }
  await muxVideo.liveStreams.disable(request.params.id);
  response.json({ message: "Live stream disabled" });
});

export const muxRoutes = router;
