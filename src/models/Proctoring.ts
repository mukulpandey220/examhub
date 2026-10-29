import mongoose, { Schema, Document, Model } from "mongoose";
import { ProctoringEventType, ProctoringSessionStatus } from "@/types";

// =========================================================================
// 1. PROCTORING SESSION MODEL
// =========================================================================
export interface IProctoringSession extends Document {
  id: string;
  examId: string;
  attemptId: string;
  studentId: string;
  policyVersion: string;
  status: ProctoringSessionStatus;
  strikeCount: number;
  cameraActive: boolean;
  microphoneActive: boolean;
  startedAt: Date;
  endedAt?: Date;
  lastHeartbeatAt: Date;
  disqualificationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProctoringSessionSchema = new Schema<IProctoringSession>(
  {
    id: { type: String, required: true, unique: true, index: true },
    examId: { type: String, required: true, index: true },
    attemptId: { type: String, required: true, unique: true, index: true },
    studentId: { type: String, required: true, index: true },
    policyVersion: { type: String, default: "1.0" },
    status: {
      type: String,
      enum: ["CLEAR", "WARNING", "FLAGGED_FOR_REVIEW", "DISQUALIFICATION_PENDING", "DISQUALIFIED", "SUBMITTED"],
      default: "CLEAR",
      index: true,
    },
    strikeCount: { type: Number, default: 0 },
    cameraActive: { type: Boolean, default: false },
    microphoneActive: { type: Boolean, default: false },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    lastHeartbeatAt: { type: Date, default: Date.now, index: true },
    disqualificationReason: { type: String },
  },
  {
    timestamps: true,
  }
);

ProctoringSessionSchema.index({ examId: 1, status: 1 });

export const ProctoringSession: Model<IProctoringSession> =
  mongoose.models.ProctoringSession ||
  mongoose.model<IProctoringSession>("ProctoringSession", ProctoringSessionSchema);

// =========================================================================
// 2. APPEND-ONLY PROCTORING EVENT MODEL (Idempotent & Audited)
// =========================================================================
export interface IProctoringEvent extends Document {
  eventId: string;
  sessionId: string;
  examId: string;
  attemptId: string;
  studentId: string;
  eventType: ProctoringEventType;
  severity: "info" | "warning" | "strike" | "critical";
  occurredAt: Date;
  receivedAt: Date;
  durationMs?: number;
  confidence?: number;
  metadata?: Record<string, any>;
  policyVersion: string;
  processingStatus: "processed" | "flagged" | "ignored";
  createdAt: Date;
}

const ProctoringEventSchema = new Schema<IProctoringEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, required: true, index: true },
    examId: { type: String, required: true, index: true },
    attemptId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "strike", "critical"],
      default: "warning",
      index: true,
    },
    occurredAt: { type: Date, required: true },
    receivedAt: { type: Date, default: Date.now },
    durationMs: { type: Number },
    confidence: { type: Number },
    metadata: { type: Schema.Types.Mixed },
    policyVersion: { type: String, default: "1.0" },
    processingStatus: {
      type: String,
      enum: ["processed", "flagged", "ignored"],
      default: "processed",
    },
  },
  {
    timestamps: true,
  }
);

// High-efficiency compound indices for real-time audit queries
ProctoringEventSchema.index({ attemptId: 1, occurredAt: 1 });
ProctoringEventSchema.index({ examId: 1, eventType: 1 });

export const ProctoringEvent: Model<IProctoringEvent> =
  mongoose.models.ProctoringEvent ||
  mongoose.model<IProctoringEvent>("ProctoringEvent", ProctoringEventSchema);

// =========================================================================
// 3. PROCTORING REVIEW & DISPUTE AUDIT MODEL
// =========================================================================
export interface IProctoringReview extends Document {
  id: string;
  eventId?: string;
  attemptId: string;
  reviewerId: string;
  decision: "cleared" | "upheld_warning" | "disqualified" | "reinstated";
  reason: string;
  reviewedAt: Date;
  previousStatus: ProctoringSessionStatus;
  newStatus: ProctoringSessionStatus;
  createdAt: Date;
}

const ProctoringReviewSchema = new Schema<IProctoringReview>(
  {
    id: { type: String, required: true, unique: true, index: true },
    eventId: { type: String },
    attemptId: { type: String, required: true, index: true },
    reviewerId: { type: String, required: true, index: true },
    decision: {
      type: String,
      enum: ["cleared", "upheld_warning", "disqualified", "reinstated"],
      required: true,
      index: true,
    },
    reason: { type: String, required: true },
    reviewedAt: { type: Date, default: Date.now },
    previousStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const ProctoringReview: Model<IProctoringReview> =
  mongoose.models.ProctoringReview ||
  mongoose.model<IProctoringReview>("ProctoringReview", ProctoringReviewSchema);
