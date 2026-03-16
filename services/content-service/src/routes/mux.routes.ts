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
    input: parsed.data.inputUrl,
    playback_policy: ["public"]
  });

  response.status(201).json({
    message: "Mux asset created",
    data: {
      assetId: asset.id,
      playbackIds: asset.playback_ids?.map((playback) => playback.id) ?? []
    }
  });
});

export const muxRoutes = router;

