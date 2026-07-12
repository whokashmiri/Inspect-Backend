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

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value) => {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
};

const normalizeSubAssetType = (value) => {
  const text = typeof value === "string" ? value.trim().toLowerCase() : "";
  return text || null;
};

const toObjectId = (value) => {
  if (!value) return null;

  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (mongoose.Types.ObjectId.isValid(String(value))) {
    return new mongoose.Types.ObjectId(String(value));
  }

  return null;
};

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
      default: "Good",
      trim: true,
      index: true,
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

    // Sub asset type: sofa, chair, tv, etc.
    subAssetType: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
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

// Normalize asset before save/update validation
assetSchema.pre("validate", function (next) {
  const assetType = String(this.assetType || "other").trim().toLowerCase();

  this.assetType = assetType === "vehicle" ? "vehicle" : "other";

  const conditionText = normalizeText(this.condition);
  this.condition = conditionText || "Good";

  const notesText = normalizeText(this.notes);
  this.notes = notesText;
  this.hasNotes = !!notesText;

  const quantity = Number(this.quantity);

  if (!Number.isFinite(quantity) || quantity < 1) {
    this.quantity = 1;
  } else {
    this.quantity = Math.floor(quantity);
  }

  if (this.assetType === "vehicle") {
    this.quantity = 1;
    this.subAssetType = "vehicle";
  } else {
    this.brand = null;
    this.model = null;
    this.manufactureYear = null;
    this.kilometersDriven = null;
    this.subAssetType = normalizeSubAssetType(this.subAssetType);
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

// useful dropdown / filtering indexes
assetSchema.index({ projectId: 1, condition: 1 });
assetSchema.index({ projectId: 1, subAssetType: 1 });
assetSchema.index({ projectId: 1, assetType: 1, subAssetType: 1 });
assetSchema.index({ projectId: 1, parent: 1, subAssetType: 1 });
assetSchema.index({ projectId: 1, parent: 1, condition: 1 });

assetSchema.statics.getUniqueConditionsByProject = async function (projectId) {
  const objectProjectId = toObjectId(projectId);
  if (!objectProjectId) return [];

  const rows = await this.aggregate([
    {
      $match: {
        projectId: objectProjectId,
        condition: { $type: "string", $ne: "" },
      },
    },
    {
      $project: {
        condition: { $trim: { input: "$condition" } },
      },
    },
    {
      $match: {
        condition: { $ne: "" },
      },
    },
    {
      $group: {
        _id: { $toLower: "$condition" },
        label: { $first: "$condition" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        label: 1,
      },
    },
    {
      $project: {
        _id: 0,
        value: "$label",
        label: "$label",
        count: 1,
      },
    },
  ]);

  return rows;
};

assetSchema.statics.getUniqueSubAssetTypesByProject = async function (
  projectId,
  options = {}
) {
  const objectProjectId = toObjectId(projectId);
  if (!objectProjectId) return [];

  const match = {
    projectId: objectProjectId,
    assetType: "other",
    subAssetType: { $type: "string", $ne: "" },
  };

  if (options.parent !== undefined) {
    match.parent = options.parent ? toObjectId(options.parent) : null;
  }

  const rows = await this.aggregate([
    {
      $match: match,
    },
    {
      $project: {
        subAssetType: { $trim: { input: "$subAssetType" } },
      },
    },
    {
      $match: {
        subAssetType: { $ne: "" },
      },
    },
    {
      $group: {
        _id: { $toLower: "$subAssetType" },
        label: { $first: "$subAssetType" },
        count: { $sum: 1 },
      },
    },
    {
      $sort: {
        label: 1,
      },
    },
    {
      $project: {
        _id: 0,
        value: "$_id",
        label: "$label",
        count: 1,
      },
    },
  ]);

  return rows;
};

assetSchema.statics.renameSubAssetTypeInProject = async function ({
  projectId,
  oldSubAssetType,
  newSubAssetType,
  parent,
}) {
  const objectProjectId = toObjectId(projectId);

  if (!objectProjectId) {
    throw new Error("projectId is required.");
  }

  const oldValue = normalizeSubAssetType(oldSubAssetType);
  const newValue = normalizeSubAssetType(newSubAssetType);

  if (!oldValue) {
    throw new Error("Old sub asset type is required.");
  }

  if (!newValue) {
    throw new Error("New sub asset type is required.");
  }

  if (oldValue === newValue) {
    return {
      matchedCount: 0,
      modifiedCount: 0,
      unchanged: true,
      oldSubAssetType: oldValue,
      newSubAssetType: newValue,
    };
  }

  const query = {
    projectId: objectProjectId,
    assetType: "other",
    subAssetType: {
      $regex: `^${escapeRegex(oldValue)}$`,
      $options: "i",
    },
  };

  if (parent !== undefined) {
    query.parent = parent ? toObjectId(parent) : null;
  }

  const result = await this.updateMany(query, {
    $set: {
      subAssetType: newValue,
    },
  });

  return {
    matchedCount: result.matchedCount ?? result.n ?? 0,
    modifiedCount: result.modifiedCount ?? result.nModified ?? 0,
    unchanged: false,
    oldSubAssetType: oldValue,
    newSubAssetType: newValue,
  };
};

export const Asset =
  mongoose.models.assets || mongoose.model("assets", assetSchema);