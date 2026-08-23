// models/Asset.js

import mongoose from "mongoose";


// Media

const assetImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      default: null,
      trim: true,
    },

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
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: false,
    },
  },
);

const assetVoiceNoteSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      default: null,
      trim: true,
    },

    duration: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: false,
    },
  },
);


const assetImagesSchema = new mongoose.Schema(
  {
    // Vehicle only
    plate: {
      type: assetImageSchema,
      default: null,
    },

    odometer: {
      type: assetImageSchema,
      default: null,
    },

    // Other only
      main: {
      type: assetImageSchema,
      default: null,
    },
    brand: {
      type: assetImageSchema,
      default: null,
    },

    // Shared
    details: {
      type: assetImageSchema,
      default: null,
    },

    other: {
      type: [assetImageSchema],
      default: [],
    },
  },
  {
    _id: false,
  },
);


// Helpers


const normalizeText = (value) => {
  const text =
    typeof value === "string"
      ? value.trim()
      : "";

  return text || null;
};


const normalizeTaxonomyId = (value) => {
  const text =
    typeof value === "string"
      ? value.trim()
      : "";

  return text || null;
};

const toObjectId = (value) => {
  if (!value) {
    return null;
  }

  if (
    value instanceof
    mongoose.Types.ObjectId
  ) {
    return value;
  }

  if (
    mongoose.Types.ObjectId.isValid(
      String(value),
    )
  ) {
    return new mongoose.Types.ObjectId(
      String(value),
    );
  }

  return null;
};


// Asset

const assetSchema =
  new mongoose.Schema(
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

      asset_description: {
        type: String,
        default: null,
        trim: true,
        },
      condition: {
        type: String,
        default: "Good",
        trim: true,
        index: true,
      },

      val_tech_id: {
  type: Number,
  default: null,
  immutable: true,
  min: 1,
},

client_code: {
  type: String,
  default: null,
  trim: true,
  index: true,
},

employer: {
  type: String,
  default: null,
  trim: true,
  index: true,
},

      assetType: {
        type: String,
        enum: ["vehicle", "other"],
        default: "other",
        lowercase: true,
        trim: true,
        index: true,
      },



      categoryId: {
        type: String,
        default: null,
        trim: true,
        index: true,
      },

      category: {
        type: String,
        default: null,
        trim: true,
      },

      typeId: {
        type: String,
        default: null,
        trim: true,
        index: true,
      },

      type: {
        type: String,
        default: null,
        trim: true,
      },

      nameId: {
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
        type:
          mongoose.Schema.Types.Mixed,
        default: {},
      },

      normalizedData: {
  type: mongoose.Schema.Types.Mixed,
  default: {},
},

newAssetLocation: {
  type: String,
  default: null,
  trim: true,
},

updatedAt: {
  type: Date,
  default: null,
  index: true,
},

      isPresent: {
        type: Boolean,
        default: true,
      },

      projectId: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Project",
        required: true,
        index: true,
      },

      parent: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Folder",
        default: null,
        index: true,
      },

      isAssetFolder: {
        type: Boolean,
        default: true,
      },

      createdBy: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",
        required: true,
        index: true,
      },

      // -----------------------------------------------------------------------
      // Media
      // -----------------------------------------------------------------------

      images: {
        type: assetImagesSchema,
        default: () => ({}),
      },

      voiceNotes: {
        type: [assetVoiceNoteSchema],
        default: [],
      },

      // -----------------------------------------------------------------------
      // Status / notes
      // -----------------------------------------------------------------------

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
    {
      timestamps: true,
    },
  );


assetSchema.pre(
  "validate",
  function (next) {
    const assetType = String(
      this.assetType || "other",
    )
      .trim()
      .toLowerCase();

    this.assetType =
      assetType === "vehicle"
        ? "vehicle"
        : "other";

 
    const nameText =
      normalizeText(this.name);

    if (nameText) {
      this.name = nameText;
    }

    const conditionText =
      normalizeText(
        this.condition,
      );

    this.condition =
      conditionText || "Good";

    const notesText =
      normalizeText(this.notes);

    this.notes = notesText;
    this.hasNotes = !!notesText;

    this.newAssetLocation =
  normalizeText(
    this.newAssetLocation,
  );

    const quantity = Number(
      this.quantity,
    );

    if (
      !Number.isFinite(quantity) ||
      quantity < 1
    ) {
      this.quantity = 1;
    } else {
      this.quantity =
        Math.floor(quantity);
    }

    // -------------------------------------------------------------------------
    // Images
    // -------------------------------------------------------------------------

    if (!this.images) {
      this.images = {};
    }

    // -------------------------------------------------------------------------
    // Vehicle
    // -------------------------------------------------------------------------

    if (
      this.assetType ===
      "vehicle"
    ) {
      this.quantity = 1;


      // Vehicle doesn't use AssetGallery taxonomy.
      this.categoryId = null;
      this.category = null;

      this.typeId = null;
      this.type = null;

      this.nameId = null;

      // Other-only image slot.
      this.images.brand = null;

      next();
      return;
    }

    // -------------------------------------------------------------------------
    // Other asset
    // -------------------------------------------------------------------------

    this.brand = null;
    this.model = null;

    this.manufactureYear =
      null;

    this.kilometersDriven =
      null;

    // Normalize taxonomy IDs.
    this.categoryId =
      normalizeTaxonomyId(
        this.categoryId,
      );

    this.typeId =
      normalizeTaxonomyId(
        this.typeId,
      );

    this.nameId =
      normalizeTaxonomyId(
        this.nameId,
      );

    // Preserve taxonomy labels exactly except trimming.
    this.category =
      normalizeText(
        this.category,
      );

    this.type =
      normalizeText(this.type);

    // Other assets don't use vehicle-only slots.
    this.images.plate = null;
    this.images.odometer =
      null;

    next();
  },
);

// -----------------------------------------------------------------------------
// Indexes
// -----------------------------------------------------------------------------

// Unique code within project only when code exists.
assetSchema.index(
  {
    projectId: 1,
    code: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      code: {
        $type: "string",
        $ne: "",
      },
    },
  },
);

assetSchema.index(
  {
    val_tech_id: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      val_tech_id: {
        $type: "number",
      },
    },
  },
);

// Existing indexes
assetSchema.index({
  projectId: 1,
  condition: 1,
});



assetSchema.index({
  projectId: 1,
  parent: 1,
  condition: 1,
});

assetSchema.index({
  projectId: 1,
  updatedAt: -1,
});
// -----------------------------------------------------------------------------
// NEW taxonomy indexes
// -----------------------------------------------------------------------------

assetSchema.index({
  projectId: 1,
  categoryId: 1,
});

assetSchema.index({
  projectId: 1,
  typeId: 1,
});

assetSchema.index({
  projectId: 1,
  nameId: 1,
});

assetSchema.index({
  projectId: 1,
  categoryId: 1,
  typeId: 1,
});

assetSchema.index({
  projectId: 1,
  newAssetLocation: 1,
});
assetSchema.index({
  projectId: 1,
  parent: 1,
  newAssetLocation: 1,
});

assetSchema.index({
  projectId: 1,
  "normalizedData.asset_location": 1,
});
assetSchema.index({
  projectId: 1,
  parent: 1,
  categoryId: 1,
  typeId: 1,
});

// -----------------------------------------------------------------------------
// Unique conditions
// -----------------------------------------------------------------------------

assetSchema.statics.getUniqueConditionsByProject =
  async function (
    projectId,
  ) {
    const objectProjectId =
      toObjectId(projectId);

    if (!objectProjectId) {
      return [];
    }

    const rows =
      await this.aggregate([
        {
          $match: {
            projectId:
              objectProjectId,

            condition: {
              $type: "string",
              $ne: "",
            },
          },
        },

        {
          $project: {
            condition: {
              $trim: {
                input:
                  "$condition",
              },
            },
          },
        },

        {
          $match: {
            condition: {
              $ne: "",
            },
          },
        },

        {
          $group: {
            _id: {
              $toLower:
                "$condition",
            },

            label: {
              $first:
                "$condition",
            },

            count: {
              $sum: 1,
            },
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


// -----------------------------------------------------------------------------
// Export
// -----------------------------------------------------------------------------

export const Asset =
  mongoose.models.assets ||
  mongoose.model(
    "assets",
    assetSchema,
  );