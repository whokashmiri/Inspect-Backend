// models/Project.js
import mongoose from "mongoose";

const inspectorFileSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "excel",
        "pdf",
        "word",
        "image",
        "video", // NEW
        "audio",
        "other",
      ],
    },

    url: {
      type: String,
      required: true,
      trim: true,
    },

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
  enum: ["digitalocean", "cloudinary"],
  default: "digitalocean",
  trim: true,
},

spacesKey: {
  type: String,
  trim: true,
  default: null,
  required() {
    return this.storage === "digitalocean";
  },
},

publicId: {
  type: String,
  trim: true,
  default: null,
  required() {
    return this.storage === "cloudinary";
  },
},

duration: {
  type: Number,
  default: null,
},

thumbnailUrl: {
  type: String,
  trim: true,
  default: null,
},

    mimeType: {
      type: String,
      trim: true,
      default: "",
    },

    sizeBytes: {
      type: Number,
      default: 0,
    },

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

    // NEW: inspection location copied from
    // reportData.inspectionLocation
    inspectionLocation: {
      type: String,
      trim: true,
      default: "",
    },

    // NEW: inspection map copied from
    // reportData.inspectionMapUrl
    inspectionMapUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // NEW: inspection date copied from
    // reportData.inspectionDate
    inspectionDate: {
      type: Date,
      default: null,
      index: true,
    },

    locations: {
      type: [locationSchema],
      default: [],
    },

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

    syncVersion: {
      type: Number,
      default: 1,
      index: true,
    },

    lastSyncedChangeAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Project =
  mongoose.models.mv_projects ||
  mongoose.model("mv_projects", projectSchema);