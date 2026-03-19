import { Schema, model } from "mongoose";

export type DeviceCodeDocument = {
  deviceCode: string;
  userCode: string;
  userId?: Schema.Types.ObjectId;
  status: "pending" | "approved" | "expired";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

const deviceCodeSchema = new Schema<DeviceCodeDocument>(
  {
    deviceCode: { type: String, required: true, unique: true },
    userCode: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "approved", "expired"], default: "pending" },
    expiresAt: { type: Date, required: true }
  },
  { timestamps: true }
);

export const DeviceCodeModel = model<DeviceCodeDocument>("DeviceCode", deviceCodeSchema);
