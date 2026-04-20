// models/Asset.js
import mongoose from "mongoose";

const assetImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const assetVoiceNoteSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: null },
    duration: { type: Number, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);



const assetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    writtenDescription: { type: String, default: null, trim: true },

    condition: {
      type: String,
      enum: ["New", "Used", "Damaged" , "Good"],
      required: false,
      default: "Good",
    },

    assetType: {
      type: String,
      enum: ["Vehicle", "Other"],
      default: "Other",
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

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },

    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    images: { type: [assetImageSchema], default: [] },

    voiceNotes: { type: [assetVoiceNoteSchema], default: [] },
    isDone: { type: Boolean, default: false },
  },

  { timestamps: true }
);

assetSchema.index(
  { project: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: "string" } } }
);

export const Asset =
  mongoose.models.Asset || mongoose.model("Asset", assetSchema);