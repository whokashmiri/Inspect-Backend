import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ["Manager", "Inspector", "Valuator"],
    },
    passwordHash: { type: String, required: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);
