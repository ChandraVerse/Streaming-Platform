import { Router } from "express";
import { z } from "zod";
import { ContentModel } from "../models/content.model.js";
import { indexContent } from "../search/indexer.js";

const router = Router();

const contentSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  kind: z.enum(["movie", "series", "live"]),
  description: z.string().min(1),
  releaseYear: z.number().int().optional(),
  durationMinutes: z.number().int().optional(),
  languages: z.array(z.string()).default([]),
  genres: z.array(z.string()).default([]),
  ageRating: z.string().optional(),
  cast: z.array(z.string()).default([]),
  crew: z.array(z.string()).default([]),
  posterImageUrl: z.string().url().optional(),
  bannerImageUrl: z.string().url().optional(),
  trailerAssetId: z.string().optional(),
  mainAssetId: z.string().optional(),
  muxPlaybackId: z.string().optional(),
  isPremium: z.boolean().default(true),
  isKids: z.boolean().default(false),
  isLive: z.boolean().default(false),
  liveStartTime: z.coerce.date().optional()
});

router.post("/", async (request, response) => {
  const parsed = contentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const existing = await ContentModel.findOne({ slug: parsed.data.slug });
  if (existing) {
    response.status(409).json({ message: "Content slug already exists" });
    return;
  }

  const content = await ContentModel.create(parsed.data);
  await indexContent(content);

  response.status(201).json({
    message: "Content created",
    data: {
      id: content.id,
      title: content.title
    }
  });
});

router.get("/", async (request, response) => {
  const { genre, language, kids, page = "1", pageSize = "20" } = request.query;
  const filters: Record<string, unknown> = {};
  if (genre) {
    filters.genres = genre;
  }
  if (language) {
    filters.languages = language;
  }
  if (kids === "true") {
    filters.isKids = true;
  }
  const pageNumber = Number(page) || 1;
  const size = Number(pageSize) || 20;

  const [items, total] = await Promise.all([
    ContentModel.find(filters)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * size)
      .limit(size),
    ContentModel.countDocuments(filters)
  ]);

  response.json({
    data: items.map((content) => ({
      id: content.id,
      title: content.title,
      slug: content.slug,
      posterImageUrl: content.posterImageUrl,
      kind: content.kind,
      genres: content.genres,
      isPremium: content.isPremium
    })),
    page: pageNumber,
    pageSize: size,
    total
  });
});

router.get("/:id", async (request, response) => {
  const content = await ContentModel.findById(request.params.id);
  if (!content) {
    response.status(404).json({ message: "Content not found" });
    return;
  }
  response.json({
    data: {
      id: content.id,
      title: content.title,
      description: content.description,
      slug: content.slug,
      kind: content.kind,
      releaseYear: content.releaseYear,
      durationMinutes: content.durationMinutes,
      languages: content.languages,
      genres: content.genres,
      ageRating: content.ageRating,
      cast: content.cast,
      crew: content.crew,
      posterImageUrl: content.posterImageUrl,
      bannerImageUrl: content.bannerImageUrl,
      muxPlaybackId: content.muxPlaybackId,
      isPremium: content.isPremium,
      isKids: content.isKids,
      isLive: content.isLive,
      liveStartTime: content.liveStartTime
    }
  });
});

export const contentRoutes = router;
