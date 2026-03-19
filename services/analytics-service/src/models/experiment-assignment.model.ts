import { Schema, model } from "mongoose";

export type ExperimentAssignmentDocument = {
  userId: string;
  experimentId: Schema.Types.ObjectId;
  variant: string;
  createdAt: Date;
  updatedAt: Date;
};

const assignmentSchema = new Schema<ExperimentAssignmentDocument>(
  {
    userId: { type: String, required: true },
    experimentId: { type: Schema.Types.ObjectId, ref: "Experiment", required: true },
    variant: { type: String, required: true }
  },
  { timestamps: true }
);

assignmentSchema.index({ userId: 1, experimentId: 1 }, { unique: true });

export const ExperimentAssignmentModel = model<ExperimentAssignmentDocument>("ExperimentAssignment", assignmentSchema);
