import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificate extends Document {
  certificateId: string; // e.g. NYE-2026-NXT-82910
  attemptId: string;
  examId: string;
  examTitle: string;
  domainName: string;
  studentId: string;
  studentName: string;
  institutionName: string;
  score: number;
  maxScore: number;
  percentage: number;
  percentile: number;
  nationalRank: number;
  isTopRanker: boolean;
  issuedAt: Date;
  verificationHash: string;
  publicUrl: string;
  createdAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    attemptId: { type: String, required: true, unique: true, index: true },
    examId: { type: String, required: true, index: true },
    examTitle: { type: String, required: true },
    domainName: { type: String, required: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    institutionName: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    percentage: { type: Number, required: true },
    percentile: { type: Number, required: true },
    nationalRank: { type: Number, required: true },
    isTopRanker: { type: Boolean, default: false },
    issuedAt: { type: Date, default: Date.now },
    verificationHash: { type: String, required: true, unique: true },
    publicUrl: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate ||
  mongoose.model<ICertificate>("Certificate", CertificateSchema);
