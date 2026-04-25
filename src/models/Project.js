
//models/Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    workflowStatus: {
      type: String,
      required: true,
      default: "new",
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
  }
);

export const Project =
  mongoose.models.Project || mongoose.model("mv_projects", projectSchema);