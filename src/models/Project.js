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

    createdAt: {
      type: Date,
      default: Date.now,
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

    // NEW: file can belong to one or more locations
    locationIds: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      trim: true,
      default: "",
    },

    region: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
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
      default: "",
    },

    // phone now belongs to location
    primaryPhone: {
      type: String,
      trim: true,
      default: "",
    },

    secondaryPhone: {
      type: String,
      trim: true,
      default: "",
    },

    // NEW
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const inspectionAssignmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },

    inspectorUserId: {
      type: String,
      required: true,
      trim: true,
    },

    inspectorName: {
      type: String,
      trim: true,
      default: "",
    },

    locationIds: {
      type: [String],
      default: [],
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
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

    // workflowStatus: {
    //   type: String,
    //   required: true,
    //   default: "new",
    //   trim: true,
    // },

    workflowStatus: {
  type: String,
  enum: ["new", "done"],
  required: true,
  default: "new",
  trim: true,
},

isFavorite: {
  type: Boolean,
  default: false,
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

    // contacts removed intentionally
    inspectorFiles: {
      type: [inspectorFileSchema],
      default: [],
    },

    inspectionAssignments: {
  type: [inspectionAssignmentSchema],
  default: [],
},

    displayNumber: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Project =
  mongoose.models.mv_projects ||
  mongoose.model("mv_projects", projectSchema);