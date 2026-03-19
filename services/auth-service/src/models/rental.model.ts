import { Schema, model } from "mongoose";

export type RentalDocument = {
  userId: Schema.Types.ObjectId;
  contentId: string;
  startsAt: Date;
  endsAt: Date;
  status: "active" | "expired" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
};

const rentalSchema = new Schema<RentalDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    contentId: { type: String, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" }
  },
  { timestamps: true }
);

rentalSchema.index({ userId: 1, contentId: 1 });

export const RentalModel = model<RentalDocument>("Rental", rentalSchema);
