// models/Project.js
import mongoose from "mongoose";

const inspectorFileSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },

    name: { type: String, required: true, trim: true },

    type: {
      type: String,
      required: true,
      enum: ["excel", "pdf", "word", "image", "audio", "other"],
    },

    url: { type: String, required: true },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    storage: {
      type: String,
      default: "digitalocean",
      trim: true,
    },

    spacesKey: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      trim: true,
    },

    sizeBytes: {
      type: Number,
      default: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Location Schema
const locationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
    },

    region: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    mapUrl: {
      type: String,
      trim: true,
    },

    primaryPhone: {
      type: String,
      trim: true,
    },

    secondaryPhone: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);
const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

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

    reportType: {
      type: String,
      enum: ["simple", "detailed"],
      default: "simple",
    },

    reportData: {
      type: Object,
      default: {},
    },

    locations: {
      type: [locationSchema],
      default: [],
    },

  

    inspectorFiles: {
      type: [inspectorFileSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Project =
  mongoose.models.Project ||
  mongoose.model("mv_projects", projectSchema);