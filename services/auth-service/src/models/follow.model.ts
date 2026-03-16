import { Schema, model } from "mongoose";

export type FollowDocument = {
  followerId: string;
  followeeId: string;
  createdAt: Date;
  updatedAt: Date;
};

const followSchema = new Schema<FollowDocument>(
  {
    followerId: { type: String, required: true },
    followeeId: { type: String, required: true }
  },
  { timestamps: true }
);

followSchema.index({ followerId: 1, followeeId: 1 }, { unique: true });

export const FollowModel = model<FollowDocument>("Follow", followSchema);

