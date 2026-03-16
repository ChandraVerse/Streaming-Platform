import { Schema, model } from "mongoose";

export type RatingDocument = {
  userId: string;
  contentId: string;
  rating: number;
  review?: string;
  createdAt: Date;
  updatedAt: Date;
};

const ratingSchema = new Schema<RatingDocument>(
  {
    userId: { type: String, required: true },
    contentId: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String }
  },
  { timestamps: true }
);

ratingSchema.index({ contentId: 1, createdAt: -1 });

export const RatingModel = model<RatingDocument>("Rating", ratingSchema);

