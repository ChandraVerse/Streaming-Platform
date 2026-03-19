import { Schema, model } from "mongoose";

export type ChannelDocument = {
  name: string;
  slug: string;
  description?: string;
  timezone: string;
  logoUrl?: string;
  isSports: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const channelSchema = new Schema<ChannelDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    timezone: { type: String, default: "UTC" },
    logoUrl: { type: String },
    isSports: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const ChannelModel = model<ChannelDocument>("Channel", channelSchema);
