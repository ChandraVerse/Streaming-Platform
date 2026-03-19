import { Schema, model } from "mongoose";

export type DownloadLicenseDocument = {
  userId: string;
  contentId: Schema.Types.ObjectId;
  deviceId: string;
  expiresAt: Date;
  status: "active" | "revoked" | "expired";
  createdAt: Date;
  updatedAt: Date;
};

const downloadLicenseSchema = new Schema<DownloadLicenseDocument>(
  {
    userId: { type: String, required: true },
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
    deviceId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    status: { type: String, enum: ["active", "revoked", "expired"], default: "active" }
  },
  { timestamps: true }
);

downloadLicenseSchema.index({ userId: 1, contentId: 1, status: 1 });

export const DownloadLicenseModel = model<DownloadLicenseDocument>("DownloadLicense", downloadLicenseSchema);
