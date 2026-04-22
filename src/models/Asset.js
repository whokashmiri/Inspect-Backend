// models/Asset.js
import mongoose from "mongoose";

const assetImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: null, trim: true },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const assetVoiceNoteSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: null, trim: true },
    duration: { type: Number, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    writtenDescription: {
      type: String,
      default: null,
      trim: true,
    },

    condition: {
      type: String,
      enum: ["New", "Used", "Damaged", "Good"],
      default: null,
    },

    assetType: {
      type: String,
      enum: ["vehicle", "other"],
      default: "other",
      lowercase: true,
      trim: true,
    },

    brand: {
      type: String,
      default: null,
      trim: true,
    },

    code: {
      type: String,
      default: null,
      trim: true,
    },

    model: {
      type: String,
      default: null,
      trim: true,
    },

    manufactureYear: {
      type: String,
      default: null,
      trim: true,
    },

    kilometersDriven: {
      type: String,
      default: null,
      trim: true,
    },

    isPresent: {
      type: Boolean,
      default: true,
    },

    // old: project
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    // old: folder
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },

    // added based on new structure
    isAssetFolder: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    images: {
      type: [assetImageSchema],
      default: [],
    },

    voiceNotes: {
      type: [assetVoiceNoteSchema],
      default: [],
    },

    isDone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// unique code inside one project only when code exists and is not null/empty
assetSchema.index(
  { projectId: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      code: { $type: "string" },
    },
  }
);

export const Asset =
  mongoose.models.Asset || mongoose.model("pic_assets", assetSchema);