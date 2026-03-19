import { Schema, model } from "mongoose";

export type RecommendationDocument = {
  userId: string;
  contentIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

const recommendationSchema = new Schema<RecommendationDocument>(
  {
    userId: { type: String, required: true, unique: true },
    contentIds: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const RecommendationModel = model<RecommendationDocument>("Recommendation", recommendationSchema);
