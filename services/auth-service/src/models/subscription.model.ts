import { Schema, model } from "mongoose";

export type SubscriptionDocument = {
  userId: Schema.Types.ObjectId;
  planId: string;
  status: "active" | "trial" | "cancelled" | "expired";
  startedAt: Date;
  endsAt?: Date;
  referralCode?: string;
  createdAt: Date;
  updatedAt: Date;
};

const subscriptionSchema = new Schema<SubscriptionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    planId: { type: String, required: true },
    status: { type: String, enum: ["active", "trial", "cancelled", "expired"], required: true },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date },
    referralCode: { type: String }
  },
  { timestamps: true }
);

export const SubscriptionModel = model<SubscriptionDocument>("Subscription", subscriptionSchema);

export const SUBSCRIPTION_PLANS = [
  { id: "mobile", name: "Mobile", priceInr: 149, videoQuality: "HD", maxScreens: 1 },
  { id: "standard", name: "Standard", priceInr: 499, videoQuality: "Full HD", maxScreens: 2 },
  { id: "premium", name: "Premium", priceInr: 799, videoQuality: "4K + HDR", maxScreens: 4 }
] as const;
