import { Schema, model } from "mongoose";

export type AdCampaignDocument = {
  name: string;
  slotId: Schema.Types.ObjectId;
  mediaUrl: string;
  clickUrl?: string;
  contentIds: Schema.Types.ObjectId[];
  startsAt: Date;
  endsAt: Date;
  weight: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const adCampaignSchema = new Schema<AdCampaignDocument>(
  {
    name: { type: String, required: true, trim: true },
    slotId: { type: Schema.Types.ObjectId, ref: "AdSlot", required: true },
    mediaUrl: { type: String, required: true },
    clickUrl: { type: String },
    contentIds: { type: [Schema.Types.ObjectId], ref: "Content", default: [] },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    weight: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

adCampaignSchema.index({ slotId: 1, startsAt: 1, endsAt: 1 });

export const AdCampaignModel = model<AdCampaignDocument>("AdCampaign", adCampaignSchema);
