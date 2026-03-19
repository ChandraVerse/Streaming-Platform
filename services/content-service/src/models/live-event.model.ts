import { Schema, model } from "mongoose";

export type LiveEventDocument = {
  contentId: Schema.Types.ObjectId;
  channelId?: Schema.Types.ObjectId;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  period: string;
  clock: string;
  status: "upcoming" | "live" | "final";
  updatedAt: Date;
  createdAt: Date;
};

const liveEventSchema = new Schema<LiveEventDocument>(
  {
    contentId: { type: Schema.Types.ObjectId, ref: "Content", required: true },
    channelId: { type: Schema.Types.ObjectId, ref: "Channel" },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeScore: { type: Number, default: 0 },
    awayScore: { type: Number, default: 0 },
    period: { type: String, default: "" },
    clock: { type: String, default: "" },
    status: { type: String, enum: ["upcoming", "live", "final"], default: "upcoming" }
  },
  { timestamps: true }
);

liveEventSchema.index({ contentId: 1 });

export const LiveEventModel = model<LiveEventDocument>("LiveEvent", liveEventSchema);
