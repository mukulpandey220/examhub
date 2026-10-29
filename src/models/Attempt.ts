import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttempt extends Document {
  id: string;
  examId: string;
  examTitle: string;
  domainSlug: string;
  userId: string;
  userEmail: string;
  userName: string;
  startedAt: Date;
  expiresAt: Date;
  submittedAt?: Date;
  status: "in_progress" | "submitted" | "expired" | "graded" | "disqualified";
  answers: Map<string, any>;
  markedForReview: string[];
  timeSpentSeconds: number;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount?: number;
  allIndiaPercentile?: number;
  nationalRank?: number;
  isTopRanker?: boolean;
  certificateId?: string;
  sectionScores?: Record<string, any>;
  codingSubmissions?: Record<string, any>;
  proctoringSessionId?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttemptSchema = new Schema<IAttempt>(
  {
    id: { type: String, required: true, unique: true, index: true },
    examId: { type: String, required: true, index: true },
    examTitle: { type: String, required: true },
    domainSlug: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    startedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    submittedAt: { type: Date },
    status: {
      type: String,
      enum: ["in_progress", "submitted", "expired", "graded", "disqualified"],
      default: "in_progress",
      index: true,
    },
    answers: { type: Map, of: Schema.Types.Mixed, default: {} },
    markedForReview: { type: [String], default: [] },
    timeSpentSeconds: { type: Number, default: 0 },
    score: { type: Number },
    maxScore: { type: Number },
    percentage: { type: Number },
    passed: { type: Boolean },
    correctCount: { type: Number },
    incorrectCount: { type: Number },
    unansweredCount: { type: Number },
    allIndiaPercentile: { type: Number },
    nationalRank: { type: Number },
    isTopRanker: { type: Boolean, default: false },
    certificateId: { type: String, index: true },
    sectionScores: { type: Schema.Types.Mixed },
    codingSubmissions: { type: Schema.Types.Mixed },
    proctoringSessionId: { type: String, index: true },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  }
);

// High concurrency compound indexes
AttemptSchema.index({ userId: 1, examId: 1, status: 1 });
AttemptSchema.index({ examId: 1, score: -1 });

export const Attempt: Model<IAttempt> =
  mongoose.models.Attempt || mongoose.model<IAttempt>("Attempt", AttemptSchema);
