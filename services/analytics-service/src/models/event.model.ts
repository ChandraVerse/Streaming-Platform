import { Schema, model } from "mongoose";

export type EventKind =
  | "play"
  | "pause"
  | "complete"
  | "signup"
  | "subscription_activated"
  | "rating"
  | "ad_impression"
  | "ad_click"
  | "live_join";

export type EventDocument = {
  userId?: string;
  contentId?: string;
  kind: EventKind;
  positionSeconds?: number;
  durationSeconds?: number;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
};

const eventSchema = new Schema<EventDocument>(
  {
    userId: { type: String },
    contentId: { type: String },
    kind: {
      type: String,
      enum: [
        "play",
        "pause",
        "complete",
        "signup",
        "subscription_activated",
        "rating",
        "ad_impression",
        "ad_click",
        "live_join"
      ],
      required: true
    },
    positionSeconds: { type: Number },
    durationSeconds: { type: Number },
    rating: { type: Number }
  },
  { timestamps: true }
);

eventSchema.index({ createdAt: 1 });

export const EventModel = model<EventDocument>("Event", eventSchema);
