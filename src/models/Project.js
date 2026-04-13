import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: { type: String, default: "New", trim: true },
    isFavorite: { type: Boolean, default: false },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

export const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);
