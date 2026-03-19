import { Schema, model } from "mongoose";

export type AdSlotDocument = {
  name: string;
  placement: "preroll" | "midroll" | "postroll";
  minDurationSeconds: number;
  maxDurationSeconds: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const adSlotSchema = new Schema<AdSlotDocument>(
  {
    name: { type: String, required: true, trim: true },
    placement: { type: String, enum: ["preroll", "midroll", "postroll"], required: true },
    minDurationSeconds: { type: Number, default: 5 },
    maxDurationSeconds: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const AdSlotModel = model<AdSlotDocument>("AdSlot", adSlotSchema);
