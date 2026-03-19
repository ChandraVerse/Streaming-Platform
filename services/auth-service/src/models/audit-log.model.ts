import { Schema, model } from "mongoose";

export type AuditLogDocument = {
  actorId?: Schema.Types.ObjectId;
  action: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    targetId: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = model<AuditLogDocument>("AuditLog", auditLogSchema);
