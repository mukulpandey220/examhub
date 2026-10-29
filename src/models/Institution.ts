import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInstitution extends Document {
  name: string;
  code: string;
  universityAffiliation: string;
  city: string;
  state: string;
  departments: { id: string; name: string; code: string }[];
  coordinators: { userId: string; name: string; email: string; designation: string }[];
  enrolledStudentsCount: number;
  partnershipStatus: "lead" | "scheduled" | "onboarded";
  createdAt: Date;
  updatedAt: Date;
}

const InstitutionSchema = new Schema<IInstitution>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    universityAffiliation: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    departments: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        code: { type: String, required: true },
      },
    ],
    coordinators: [
      {
        userId: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        designation: { type: String, default: "TPO" },
      },
    ],
    enrolledStudentsCount: { type: Number, default: 0 },
    partnershipStatus: {
      type: String,
      enum: ["lead", "scheduled", "onboarded"],
      default: "lead",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Institution: Model<IInstitution> =
  mongoose.models.Institution || mongoose.model<IInstitution>("Institution", InstitutionSchema);
