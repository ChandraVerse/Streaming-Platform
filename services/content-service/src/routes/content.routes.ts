import { Router } from "express";
import { z } from "zod";
import { ContentModel } from "../models/content.model.js";
import { RatingModel } from "../models/rating.model.js";
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
  const { genre, language, kids, page = "1", pageSize = "20", kind, live, liveNow } = request.query;
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
  if (kind) {
    filters.kind = kind;
  }
  if (live === "true") {
    filters.isLive = true;
  }
  if (liveNow === "true") {
    filters.isLive = true;
    filters.liveStartTime = { $lte: new Date() };
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
      isPremium: content.isPremium,
      isLive: content.isLive,
      liveStartTime: content.liveStartTime
    })),
    page: pageNumber,
    pageSize: size,
    total
  });
});

router.put("/:id", async (request, response) => {
  const partialSchema = contentSchema.partial();
  const parsed = partialSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }

  const content = await ContentModel.findById(request.params.id);
  if (!content) {
    response.status(404).json({ message: "Content not found" });
    return;
  }

  if (parsed.data.slug && parsed.data.slug !== content.slug) {
    const existingWithSlug = await ContentModel.findOne({ slug: parsed.data.slug });
    if (existingWithSlug) {
      response.status(409).json({ message: "Content slug already exists" });
      return;
    }
  }

  const fields = parsed.data;
  if (fields.title !== undefined) content.title = fields.title;
  if (fields.slug !== undefined) content.slug = fields.slug;
  if (fields.kind !== undefined) content.kind = fields.kind;
  if (fields.description !== undefined) content.description = fields.description;
  if (fields.releaseYear !== undefined) content.releaseYear = fields.releaseYear;
  if (fields.durationMinutes !== undefined) content.durationMinutes = fields.durationMinutes;
  if (fields.languages !== undefined) content.languages = fields.languages;
  if (fields.genres !== undefined) content.genres = fields.genres;
  if (fields.ageRating !== undefined) content.ageRating = fields.ageRating;
  if (fields.cast !== undefined) content.cast = fields.cast;
  if (fields.crew !== undefined) content.crew = fields.crew;
  if (fields.posterImageUrl !== undefined) content.posterImageUrl = fields.posterImageUrl;
  if (fields.bannerImageUrl !== undefined) content.bannerImageUrl = fields.bannerImageUrl;
  if (fields.trailerAssetId !== undefined) content.trailerAssetId = fields.trailerAssetId;
  if (fields.mainAssetId !== undefined) content.mainAssetId = fields.mainAssetId;
  if (fields.muxPlaybackId !== undefined) content.muxPlaybackId = fields.muxPlaybackId;
  if (fields.isPremium !== undefined) content.isPremium = fields.isPremium;
  if (fields.isKids !== undefined) content.isKids = fields.isKids;
  if (fields.isLive !== undefined) content.isLive = fields.isLive;
  if (fields.liveStartTime !== undefined) content.liveStartTime = fields.liveStartTime;

  await content.save();
  await indexContent(content);

  response.json({
    message: "Content updated",
    data: {
      id: content.id,
      title: content.title
    }
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

router.get("/:id/recommendations", async (request, response) => {
  const current = await ContentModel.findById(request.params.id);
  if (!current) {
    response.status(404).json({ message: "Content not found" });
    return;
  }

  const candidates = await ContentModel.find({
    _id: { $ne: current.id },
    genres: { $in: current.genres },
    isKids: current.isKids
  })
    .sort({ createdAt: -1 })
    .limit(50);

  const ids = candidates.map((content) => content.id);
  const ratingStats = await RatingModel.aggregate([
    {
      $match: {
        contentId: { $in: ids }
      }
    },
    {
      $group: {
        _id: "$contentId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 }
      }
    }
  ]);

  const ratingsById = new Map<
    string,
    {
      avgRating: number;
      count: number;
    }
  >();
  for (const entry of ratingStats) {
    ratingsById.set(String(entry._id), {
      avgRating: typeof entry.avgRating === "number" ? entry.avgRating : 0,
      count: typeof entry.count === "number" ? entry.count : 0
    });
  }

  const sorted = [...candidates].sort((a, b) => {
    const ratingA = ratingsById.get(String(a.id));
    const ratingB = ratingsById.get(String(b.id));
    const avgA = ratingA?.avgRating ?? 0;
    const avgB = ratingB?.avgRating ?? 0;
    if (avgA !== avgB) {
      return avgB - avgA;
    }
    const countA = ratingA?.count ?? 0;
    const countB = ratingB?.count ?? 0;
    if (countA !== countB) {
      return countB - countA;
    }
    return (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0);
  });

  const recommendations = sorted.slice(0, 10);

  response.json({
    data: recommendations.map((content) => ({
      id: content.id,
      title: content.title,
      slug: content.slug,
      posterImageUrl: content.posterImageUrl,
      kind: content.kind,
      genres: content.genres,
      isPremium: content.isPremium
    }))
  });
});

router.get("/bulk", async (request, response) => {
  const idsParam = request.query.ids;
  if (!idsParam) {
    response.json({ data: [] });
    return;
  }

  const ids = String(idsParam)
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  if (ids.length === 0) {
    response.json({ data: [] });
    return;
  }

  const items = await ContentModel.find({ _id: { $in: ids } });
  response.json({
    data: items.map((content) => ({
      id: content.id,
      title: content.title,
      slug: content.slug,
      posterImageUrl: content.posterImageUrl,
      kind: content.kind,
      genres: content.genres,
      isPremium: content.isPremium,
      isLive: content.isLive,
      liveStartTime: content.liveStartTime
    }))
  });
});

export const contentRoutes = router;
