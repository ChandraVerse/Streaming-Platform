import { Router } from "express";
import { z } from "zod";
import { ContentModel } from "../models/content.model.js";
import { RatingModel } from "../models/rating.model.js";
import { indexContent } from "../search/indexer.js";
import { env } from "../config/env.js";

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
  liveStreamId: z.string().optional(),
  livePlaybackId: z.string().optional(),
  liveBackupPlaybackId: z.string().optional(),
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
      liveStartTime: content.liveStartTime,
      livePlaybackId: content.livePlaybackId ?? content.muxPlaybackId ?? undefined
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
  if (fields.liveStreamId !== undefined) content.liveStreamId = fields.liveStreamId;
  if (fields.livePlaybackId !== undefined) content.livePlaybackId = fields.livePlaybackId;
  if (fields.liveBackupPlaybackId !== undefined) content.liveBackupPlaybackId = fields.liveBackupPlaybackId;
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
      liveStreamId: content.liveStreamId,
      livePlaybackId: content.livePlaybackId,
      liveBackupPlaybackId: content.liveBackupPlaybackId,
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

  let candidates = await ContentModel.find({
    _id: { $ne: current.id },
    genres: { $in: current.genres },
    isKids: current.isKids
  })
    .sort({ createdAt: -1 })
    .limit(50);
  try {
    const recResponse = await fetch(
      `${env.ANALYTICS_SERVICE_URL}/analytics/recommendations/related?contentId=${encodeURIComponent(
        current.id
      )}&limit=20`
    );
    if (recResponse.ok) {
      const payload = (await recResponse.json()) as { data: { contentId: string }[] };
      const ids = payload.data.map((entry) => entry.contentId);
      if (ids.length > 0) {
        const related = await ContentModel.find({ _id: { $in: ids }, isKids: current.isKids });
        if (related.length > 0) {
          candidates = related;
        }
      }
    }
  } catch {
  }

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

router.get("/top-ten", async (request, response) => {
  const kidsParam = request.query.kids;
  const language = request.query.language;
  const windowHours = Number(request.query.windowHours ?? 720) || 720;
  const limit = Number(request.query.limit ?? 10) || 10;
  const kids = kidsParam === "true" ? true : kidsParam === "false" ? false : undefined;
  try {
    const trendingRes = await fetch(
      `${env.ANALYTICS_SERVICE_URL}/analytics/trending?windowHours=${encodeURIComponent(String(windowHours))}`
    );
    if (!trendingRes.ok) {
      response.json({ data: [] });
      return;
    }
    const trendingPayload = (await trendingRes.json()) as { data: { contentId: string }[] };
    const ids = trendingPayload.data.map((entry) => entry.contentId);
    if (ids.length === 0) {
      response.json({ data: [] });
      return;
    }
    const query: Record<string, unknown> = { _id: { $in: ids } };
    if (kids !== undefined) {
      query.isKids = kids;
    }
    if (language) {
      query.languages = language;
    }
    const items = await ContentModel.find(query).limit(limit);
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
  } catch {
    response.json({ data: [] });
  }
});

const bulkImportSchema = z.object({
  csv: z.string().min(1)
});

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

router.post("/bulk-import", async (request, response) => {
  const parsed = bulkImportSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const lines = parsed.data.csv.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  if (lines.length < 2) {
    response.status(400).json({ message: "CSV must include header and at least one row" });
    return;
  }
  const headers = lines[0].split(",").map((value) => value.trim());
  const created: { id: string; title: string }[] = [];
  for (const line of lines.slice(1)) {
    const values = line.split(",").map((value) => value.trim());
    const entry: Record<string, string> = {};
    headers.forEach((header, index) => {
      entry[header] = values[index] ?? "";
    });
    if (!entry.title || !entry.description) {
      continue;
    }
    const slug = entry.slug?.length ? entry.slug : toSlug(entry.title);
    const existing = await ContentModel.findOne({ slug });
    if (existing) {
      continue;
    }
    const content = await ContentModel.create({
      title: entry.title,
      slug,
      kind: (entry.kind as "movie" | "series" | "live") || "movie",
      description: entry.description,
      genres: entry.genres ? entry.genres.split("|").map((value) => value.trim()) : [],
      languages: entry.languages ? entry.languages.split("|").map((value) => value.trim()) : [],
      isPremium: entry.isPremium ? entry.isPremium === "true" : true,
      isKids: entry.isKids ? entry.isKids === "true" : false,
      isLive: entry.isLive ? entry.isLive === "true" : false,
      liveStartTime: entry.liveStartTime ? new Date(entry.liveStartTime) : undefined,
      posterImageUrl: entry.posterImageUrl || undefined,
      bannerImageUrl: entry.bannerImageUrl || undefined
    });
    await indexContent(content);
    created.push({ id: content.id, title: content.title });
  }
  response.status(201).json({ message: "Bulk import complete", data: created });
});

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().min(1)),
  fields: z
    .object({
      isPremium: z.boolean().optional(),
      isKids: z.boolean().optional(),
      isLive: z.boolean().optional(),
      genres: z.array(z.string()).optional(),
      languages: z.array(z.string()).optional()
    })
    .partial()
});

router.post("/bulk-update", async (request, response) => {
  const parsed = bulkUpdateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
    return;
  }
  const updates = parsed.data.fields;
  const result = await ContentModel.updateMany({ _id: { $in: parsed.data.ids } }, { $set: updates });
  response.json({
    message: "Bulk update complete",
    data: {
      matched: result.matchedCount,
      modified: result.modifiedCount
    }
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
      liveStartTime: content.liveStartTime,
      livePlaybackId: content.livePlaybackId ?? content.muxPlaybackId ?? undefined
    }))
  });
});

export const contentRoutes = router;
