import { Schema, model } from "mongoose";

export type DeviceSessionDocument = {
  userId: Schema.Types.ObjectId;
  fingerprint: string;
  ip: string;
  userAgent: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const deviceSessionSchema = new Schema<DeviceSessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fingerprint: { type: String, required: true },
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    lastSeenAt: { type: Date, required: true }
  },
  { timestamps: true }
);

deviceSessionSchema.index({ userId: 1, fingerprint: 1 }, { unique: true });

export const DeviceSessionModel = model<DeviceSessionDocument>("DeviceSession", deviceSessionSchema);
