import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { DownloadLicenseModel } from "../models/download-license.model.js";
import { ContentModel } from "../models/content.model.js";
import { env } from "../config/env.js";

const router = Router();

const requestSchema = z.object({
  userId: z.string().min(1),
  contentId: z.string().min(1),
  deviceId: z.string().min(1),
  expiresInHours: z.number().int().positive().optional().default(48)
});

function signToken(payload: Record<string, string | number>) {
  const data = Object.entries(payload)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signature = crypto.createHmac("sha256", env.DOWNLOAD_SIGNING_SECRET).update(data).digest("hex");
  return `${data}&sig=${signature}`;
}

function verifyToken(token: string) {
  const parts = token.split("&");
  const payload = Object.fromEntries(parts.map((entry) => entry.split("=")));
  const signature = payload.sig;
  if (!signature) {
    return null;
  }
  delete payload.sig;
  const data = Object.entries(payload)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const expected = crypto.createHmac("sha256", env.DOWNLOAD_SIGNING_SECRET).update(data).digest("hex");
  if (expected !== signature) {
    return null;
  }
  return payload;
}

router.post("/request", async (request, response) => {
  const parsed = requestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const content = await ContentModel.findById(parsed.data.contentId);
  if (!content) {
    response.status(404).json({ message: "Content not found" });
    return;
  }
  const expiresAt = new Date(Date.now() + parsed.data.expiresInHours * 60 * 60 * 1000);
  const license = await DownloadLicenseModel.create({
    userId: parsed.data.userId,
    contentId: content.id,
    deviceId: parsed.data.deviceId,
    expiresAt,
    status: "active"
  });
  const token = signToken({
    licenseId: license.id,
    playbackId: content.muxPlaybackId ?? content.livePlaybackId ?? "",
    exp: expiresAt.getTime()
  });
  response.status(201).json({
    message: "Download license issued",
    data: {
      licenseId: license.id,
      expiresAt,
      downloadUrl: `/api/downloads/stream?token=${encodeURIComponent(token)}`
    }
  });
});

router.get("/list", async (request, response) => {
  const userId = String(request.query.userId ?? "");
  if (!userId) {
    response.json({ data: [] });
    return;
  }
  const items = await DownloadLicenseModel.find({ userId }).sort({ createdAt: -1 });
  response.json({
    data: items.map((item) => ({
      id: item.id,
      contentId: item.contentId.toString(),
      deviceId: item.deviceId,
      expiresAt: item.expiresAt,
      status: item.status
    }))
  });
});

router.post("/revoke", async (request, response) => {
  const schema = z.object({ licenseId: z.string().min(1) });
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const license = await DownloadLicenseModel.findById(parsed.data.licenseId);
  if (!license) {
    response.status(404).json({ message: "License not found" });
    return;
  }
  license.status = "revoked";
  await license.save();
  response.json({ message: "License revoked" });
});

router.get("/stream", async (request, response) => {
  const token = String(request.query.token ?? "");
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    response.status(401).json({ message: "Invalid token" });
    return;
  }
  const exp = Number(payload.exp ?? 0);
  if (!exp || exp < Date.now()) {
    response.status(401).json({ message: "Token expired" });
    return;
  }
  const license = await DownloadLicenseModel.findById(payload.licenseId ?? "");
  if (!license || license.status !== "active" || license.expiresAt.getTime() < Date.now()) {
    response.status(401).json({ message: "License invalid" });
    return;
  }
  const playbackId = String(payload.playbackId ?? "");
  if (!playbackId) {
    response.status(404).json({ message: "Playback unavailable" });
    return;
  }
  response.json({
    data: {
      playbackUrl: `https://stream.mux.com/${playbackId}.m3u8`
    }
  });
});

export const downloadsRoutes = router;
