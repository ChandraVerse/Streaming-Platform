import { Schema, model } from "mongoose";

export type ContentKind = "movie" | "series" | "live";

export type ContentDocument = {
  title: string;
  slug: string;
  kind: ContentKind;
  description: string;
  releaseYear?: number;
  durationMinutes?: number;
  languages: string[];
  genres: string[];
  ageRating?: string;
  cast: string[];
  crew: string[];
  posterImageUrl?: string;
  bannerImageUrl?: string;
  trailerAssetId?: string;
  mainAssetId?: string;
  muxPlaybackId?: string;
  isPremium: boolean;
  isKids: boolean;
  isLive: boolean;
  liveStartTime?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const contentSchema = new Schema<ContentDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    kind: { type: String, enum: ["movie", "series", "live"], required: true },
    description: { type: String, required: true },
    releaseYear: { type: Number },
    durationMinutes: { type: Number },
    languages: { type: [String], default: [] },
    genres: { type: [String], default: [] },
    ageRating: { type: String },
    cast: { type: [String], default: [] },
    crew: { type: [String], default: [] },
    posterImageUrl: { type: String },
    bannerImageUrl: { type: String },
    trailerAssetId: { type: String },
    mainAssetId: { type: String },
    muxPlaybackId: { type: String },
    isPremium: { type: Boolean, default: true },
    isKids: { type: Boolean, default: false },
    isLive: { type: Boolean, default: false },
    liveStartTime: { type: Date }
  },
  { timestamps: true }
);

contentSchema.index({ title: "text", description: "text", genres: 1, languages: 1 });

export const ContentModel = model<ContentDocument>("Content", contentSchema);
