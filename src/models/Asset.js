// models/Asset.js
import mongoose from "mongoose";

const assetImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: null, trim: true },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      default: "image",
    },

    mimeType: {
      type: String,
      default: null,
      trim: true,
    },

    duration: {
      type: Number,
      default: null,
    },

    thumbnailUrl: {
      type: String,
      default: null,
      trim: true,
    },
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
    assetId: {
      type: String,
      default: function () {
        return this._id?.toString();
      },
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    condition: {
      type: String,
      enum: ["New", "Used", "Damaged", "Good"],
      default: null,
    },

    // Main category: Vehicle or Other
    assetType: {
      type: String,
      enum: ["vehicle", "other"],
      default: "other",
      lowercase: true,
      trim: true,
      index: true,
    },

    // Sub asset type: Sofa, Chair, TV, etc.
    subAssetType: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    // Vehicle-only fields
    brand: {
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

    code: {
      type: String,
      default: null,
      trim: true,
    },

    rawData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    isPresent: {
      type: Boolean,
      default: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },

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

    hasNotes: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

// Always calculate hasNotes from notes
assetSchema.pre("validate", function (next) {
  const notesText = typeof this.notes === "string" ? this.notes.trim() : "";

  this.notes = notesText || null;
  this.hasNotes = notesText.length > 0;

  const quantity = Number(this.quantity);

  if (!Number.isFinite(quantity) || quantity < 1) {
    this.quantity = 1;
  } else {
    this.quantity = Math.floor(quantity);
  }

  if (this.assetType !== "vehicle") {
    this.brand = null;
    this.model = null;
    this.manufactureYear = null;
    this.kilometersDriven = null;
  }

  if (!this.subAssetType || !String(this.subAssetType).trim()) {
    this.subAssetType = this.assetType === "vehicle" ? "Vehicle" : null;
  }

  next();
});

// unique code inside one project only when code exists and is not null/empty
assetSchema.index(
  { projectId: 1, code: 1 },
  {
    unique: true,
    partialFilterExpression: {
      code: { $type: "string", $ne: "" },
    },
  }
);

// useful later for dropdown values per project
assetSchema.index({ projectId: 1, subAssetType: 1 });

export const Asset =
  mongoose.models.Asset || mongoose.model("assets", assetSchema);