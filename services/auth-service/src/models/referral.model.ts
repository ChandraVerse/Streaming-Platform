import { Schema, model } from "mongoose";

export type ReferralDocument = {
  referrerId: string;
  refereeId: string;
  createdAt: Date;
  updatedAt: Date;
};

const referralSchema = new Schema<ReferralDocument>(
  {
    referrerId: { type: String, required: true },
    refereeId: { type: String, required: true }
  },
  { timestamps: true }
);

referralSchema.index({ referrerId: 1, refereeId: 1 }, { unique: true });

export const ReferralModel = model<ReferralDocument>("Referral", referralSchema);

