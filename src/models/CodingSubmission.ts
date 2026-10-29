import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICodingSubmission extends Document {
  id: string;
  userId: string;
  examId?: string;
  attemptId?: string;
  problemId: string;
  code: string;
  language: string;
  status: "Accepted" | "Wrong Answer" | "Compilation Error" | "Time Limit Exceeded" | "Pending Evaluation";
  passedCases: number;
  totalCases: number;
  scoreAwarded: number;
  executionTimeMs?: number;
  memoryKb?: number;
  submittedAt: Date;
  createdAt: Date;
}

const CodingSubmissionSchema = new Schema<ICodingSubmission>(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    examId: { type: String, index: true },
    attemptId: { type: String, index: true },
    problemId: { type: String, required: true, index: true },
    code: { type: String, required: true },
    language: { type: String, required: true },
    status: {
      type: String,
      enum: ["Accepted", "Wrong Answer", "Compilation Error", "Time Limit Exceeded", "Pending Evaluation"],
      default: "Pending Evaluation",
      index: true,
    },
    passedCases: { type: Number, default: 0 },
    totalCases: { type: Number, default: 0 },
    scoreAwarded: { type: Number, default: 0 },
    executionTimeMs: { type: Number },
    memoryKb: { type: Number },
    submittedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

CodingSubmissionSchema.index({ userId: 1, problemId: 1 });

export const CodingSubmission: Model<ICodingSubmission> =
  mongoose.models.CodingSubmission ||
  mongoose.model<ICodingSubmission>("CodingSubmission", CodingSubmissionSchema);
