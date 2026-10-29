import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProjectSubmission extends Document {
  id: string;
  teamId?: string;
  teamName: string;
  leadUserId: string;
  members: { userId: string; name: string; email: string }[];
  projectTitle: string;
  domainSlug: string;
  description: string;
  repositoryUrl: string;
  demoUrl?: string;
  attachments: { name: string; fileUrl: string; sizeBytes: number; mimeType: string }[];
  status: "draft" | "submitted" | "judged";
  scorecards: {
    judgeId: string;
    judgeName: string;
    criteriaScores: {
      innovation: number;
      architecture: number;
      execution: number;
      presentation: number;
    };
    totalScore: number;
    feedback: string;
    scoredAt: Date;
  }[];
  finalScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSubmissionSchema = new Schema<IProjectSubmission>(
  {
    id: { type: String, required: true, unique: true, index: true },
    teamId: { type: String, index: true },
    teamName: { type: String, required: true, trim: true },
    leadUserId: { type: String, required: true, index: true },
    members: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
      },
    ],
    projectTitle: { type: String, required: true, trim: true },
    domainSlug: { type: String, required: true, index: true },
    description: { type: String, required: true },
    repositoryUrl: { type: String, required: true },
    demoUrl: { type: String },
    attachments: [
      {
        name: { type: String, required: true },
        fileUrl: { type: String, required: true },
        sizeBytes: { type: Number, required: true },
        mimeType: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      enum: ["draft", "submitted", "judged"],
      default: "draft",
      index: true,
    },
    scorecards: [
      {
        judgeId: { type: String, required: true },
        judgeName: { type: String, required: true },
        criteriaScores: {
          innovation: { type: Number, default: 0 },
          architecture: { type: Number, default: 0 },
          execution: { type: Number, default: 0 },
          presentation: { type: Number, default: 0 },
        },
        totalScore: { type: Number, default: 0 },
        feedback: { type: String },
        scoredAt: { type: Date, default: Date.now },
      },
    ],
    finalScore: { type: Number },
  },
  {
    timestamps: true,
  }
);

export const ProjectSubmission: Model<IProjectSubmission> =
  mongoose.models.ProjectSubmission ||
  mongoose.model<IProjectSubmission>("ProjectSubmission", ProjectSubmissionSchema);
