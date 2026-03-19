import { Schema, model } from "mongoose";

export type PartnerEntitlementDocument = {
  userId: Schema.Types.ObjectId;
  partnerName: string;
  externalId: string;
  planId?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const partnerEntitlementSchema = new Schema<PartnerEntitlementDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    partnerName: { type: String, required: true },
    externalId: { type: String, required: true },
    planId: { type: String },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

partnerEntitlementSchema.index({ userId: 1, partnerName: 1, externalId: 1 }, { unique: true });

export const PartnerEntitlementModel = model<PartnerEntitlementDocument>("PartnerEntitlement", partnerEntitlementSchema);
