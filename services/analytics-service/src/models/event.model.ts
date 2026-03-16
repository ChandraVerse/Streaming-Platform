import { Schema, model } from "mongoose";

export type EventKind = "play" | "pause" | "complete" | "signup" | "subscription_activated";

export type EventDocument = {
  userId?: string;
  contentId?: string;
  kind: EventKind;
  createdAt: Date;
  updatedAt: Date;
};

const eventSchema = new Schema<EventDocument>(
  {
    userId: { type: String },
    contentId: { type: String },
    kind: { type: String, enum: ["play", "pause", "complete", "signup", "subscription_activated"], required: true }
  },
  { timestamps: true }
);

eventSchema.index({ createdAt: 1 });

export const EventModel = model<EventDocument>("Event", eventSchema);

