import { Schema, model } from "mongoose";

export type ScheduleDocument = {
  channelId: Schema.Types.ObjectId;
  contentId?: Schema.Types.ObjectId;
  title: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  status: "upcoming" | "live" | "ended";
  createdAt: Date;
  updatedAt: Date;
};

const scheduleSchema = new Schema<ScheduleDocument>(
  {
    channelId: { type: Schema.Types.ObjectId, ref: "Channel", required: true },
    contentId: { type: Schema.Types.ObjectId, ref: "Content" },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, default: "UTC" },
    status: { type: String, enum: ["upcoming", "live", "ended"], default: "upcoming" }
  },
  { timestamps: true }
);

scheduleSchema.index({ channelId: 1, startTime: 1 });

export const ScheduleModel = model<ScheduleDocument>("Schedule", scheduleSchema);
