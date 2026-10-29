import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole } from "@/types";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  institutionId?: string;
  departmentId?: string;
  university?: string;
  courseDegree?: string;
  branch?: string;
  semester?: number;
  tokens: number;
  unlockedExams: string[];
  onboarded: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["student", "institution_coordinator", "exam_admin", "super_admin"],
      default: "student",
      index: true,
    },
    institutionId: { type: String, index: true },
    departmentId: { type: String },
    university: { type: String },
    courseDegree: { type: String },
    branch: { type: String },
    semester: { type: Number },
    tokens: { type: Number, default: 100 },
    unlockedExams: { type: [String], default: [] },
    onboarded: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Pre-save password hashing
UserSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
