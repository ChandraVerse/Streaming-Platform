import { Schema, model } from "mongoose";

export type ExperimentDocument = {
  name: string;
  variants: string[];
  trafficSplit: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const experimentSchema = new Schema<ExperimentDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    variants: { type: [String], required: true },
    trafficSplit: { type: [Number], required: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const ExperimentModel = model<ExperimentDocument>("Experiment", experimentSchema);
