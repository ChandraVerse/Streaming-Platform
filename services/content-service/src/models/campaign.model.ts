import { Schema, model } from "mongoose";

export type CampaignDocument = {
  name: string;
  placement: "hero" | "row" | "banner";
  contentIds: Schema.Types.ObjectId[];
  startsAt: Date;
  endsAt: Date;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const campaignSchema = new Schema<CampaignDocument>(
  {
    name: { type: String, required: true, trim: true },
    placement: { type: String, enum: ["hero", "row", "banner"], required: true },
    contentIds: { type: [Schema.Types.ObjectId], ref: "Content", default: [] },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

campaignSchema.index({ placement: 1, startsAt: 1, endsAt: 1 });

export const CampaignModel = model<CampaignDocument>("Campaign", campaignSchema);
