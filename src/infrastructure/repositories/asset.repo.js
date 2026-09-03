// infrastructure/repositories/asset.repo.js
import mongoose from "mongoose";
import { Asset } from "../../models/Asset.js";
import { AssetSequence } from "../../models/AssetSequence.js";

const toId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value && value._id) {
    return value._id.toString();
  }
  if (typeof value.toString === "function") {
    return value.toString();
  }
  return null;
};

const mapCreatedBy = (user) => {
  if (!user) return null;
  return {
    id: toId(user._id ?? user),
    fullName: user.fullName ?? null,
    email: user.email ?? null,
    role: user.role ?? null,
  };
};


function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;

  return path.split(".").reduce((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    return acc[key];
  }, obj);
}

function extractRawDataKeys(obj, prefix = "", keys = new Set()) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return keys;

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    keys.add(fullKey);

    const value = obj[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      extractRawDataKeys(value, fullKey, keys);
    }
  }

  return keys;
}

function normalizeAssetDescription(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const text = String(value).trim();

  return text || null;
}

const mapImage = (image) => ({
  id: toId(image._id),
  url: image.url,
  publicId: image.publicId ?? null,
  mediaType: image.mediaType ?? "image",
  mimeType: image.mimeType ?? null,
  duration: image.duration ?? null,
  thumbnailUrl: image.thumbnailUrl ?? null,
  createdAt: image.createdAt,
});

const mapImages = (images = {}) => ({
  main: images?.main ? mapImage(images.main) : null,
  plate: images?.plate ? mapImage(images.plate) : null,
  details: images?.details ? mapImage(images.details) : null,
  odometer: images?.odometer ? mapImage(images.odometer) : null,
  brand: images?.brand ? mapImage(images.brand) : null,
  other: Array.isArray(images?.other) ? images.other.map(mapImage) : [],
});

const mapVoiceNote = (note) => ({
  id: toId(note._id),
  url: note.url,
  publicId: note.publicId ?? null,
  duration: note.duration ?? null,
  createdAt: note.createdAt,
});

const mapAsset = (doc) => ({
  id: toId(doc._id),

  name: doc.name,
  val_tech_id: doc.val_tech_id ?? null,
client_code: doc.client_code ?? null,
employer: doc.employer ?? null,
  categoryId: doc.categoryId ?? null,
category: doc.category ?? null,

typeId: doc.typeId ?? null,
type: doc.type ?? null,

nameId: doc.nameId ?? null,
 asset_description: doc.asset_description ?? null,

  condition: doc.condition ?? null,

  assetType: doc.assetType ?? "other",

  normalizedData: cleanNormalizedData(doc.normalizedData ?? {}),
newAssetLocation: doc.newAssetLocation ?? null,

  quantity: doc.quantity ?? 1,

  brand: doc.brand ?? null,
  model: doc.model ?? null,
  code: doc.code ?? null,
  manufactureYear: doc.manufactureYear ?? null,
  kilometersDriven: doc.kilometersDriven ?? null,

  isDone: doc.isDone ?? false,

  hasNotes: doc.hasNotes ?? false,
  notes: doc.notes ?? null,

  isPresent: doc.isPresent ?? true,

  rawData: cleanRawData(doc.rawData ?? {}),

  parent: toId(doc.parent),
  projectId: toId(doc.projectId),

  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,

  // updatedAt: doc.updatedAt ?? null,

  createdBy: mapCreatedBy(doc.createdBy),
  updatedBy: mapCreatedBy(doc.updatedBy),

  images: mapImages(doc.images || {}),
  voiceNotes: (doc.voiceNotes || []).map(mapVoiceNote),
});


function advancedValueMatches(value, search) {
  if (value === null || value === undefined) return false;

  if (!search) return true;

  const needle = String(search).toLowerCase();

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value).toLowerCase().includes(needle);
  }

  if (Array.isArray(value)) {
    return value.some((item) => advancedValueMatches(item, search));
  }

  if (typeof value === "object") {
    return Object.values(value).some((item) =>
      advancedValueMatches(item, search)
    );
  }

  return false;
}

function normalizeQuantity(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 1) {
    return 1;
  }

  return Math.floor(numberValue);
}


function normalizeOptionalText(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const text = String(value).trim();

  return text || null;
}
function normalizeLocation(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const text = String(value).trim();

  return text || null;
}

function cleanNormalizedData(normalizedData) {
  return normalizedData &&
    typeof normalizedData === "object" &&
    !Array.isArray(normalizedData)
    ? { ...normalizedData }
    : {};
}

function normalizeCondition(value) {
  if (value === undefined) return undefined;

  const text = String(value || "").trim();

  return text || null;
}

function cleanRawData(rawData) {
  const cleaned =
    rawData && typeof rawData === "object" && !Array.isArray(rawData)
      ? { ...rawData }
      : {};

  delete cleaned.quantity;
  delete cleaned.subAssetType;
  delete cleaned.customAssetType;

  return cleaned;
}

function normalizeNotes(notes) {
  const notesText = String(notes || "").trim();

  return {
    notes: notesText || null,
    hasNotes: notesText.length > 0,
  };
}

const normalizeImageForDb = (item) => {
  if (!item || typeof item !== "object") return null;

  const url = typeof item.url === "string" ? item.url.trim() : "";
  if (!url) return null;

  return {
    url,
    publicId: item.publicId ?? null,
    mediaType: item.mediaType === "video" ? "video" : "image",
    mimeType: item.mimeType ?? null,
    duration: item.duration ?? null,
    thumbnailUrl: item.thumbnailUrl ?? null,
  };
};

const normalizeImagesForDb = (images = {}) => ({
  main: normalizeImageForDb(images.main),
  plate: normalizeImageForDb(images.plate),
  details: normalizeImageForDb(images.details),
  odometer: normalizeImageForDb(images.odometer),
  brand: normalizeImageForDb(images.brand),
  other: Array.isArray(images.other)
    ? images.other.map(normalizeImageForDb).filter(Boolean)
    : [],
});

async function getNextValTechId() {
  const sequence =
    await AssetSequence.findOneAndUpdate(
      { _id: "val_tech_id" },
      {
        $inc: {
          value: 1,
        },
      },
      {
        new: true,
      },
    ).lean();

  if (!sequence) {
    const error =
      new Error(
        'Missing asset sequence: "val_tech_id"',
      );

    error.code =
      "ASSET_SEQUENCE_MISSING";

    throw error;
  }

  const nextValue =
    Number(sequence.value);

  if (
    !Number.isSafeInteger(nextValue) ||
    nextValue < 1
  ) {
    const error =
      new Error(
        "Invalid val_tech_id sequence value",
      );

    error.code =
      "ASSET_SEQUENCE_INVALID";

    throw error;
  }

  return nextValue;
}

export const assetRepository = {
async create({
  name,
   asset_description,
  condition,
  categoryId,
  category,
  typeId,
  type,
  nameId,
  assetType,
  normalizedData,
  newAssetLocation,
  quantity,
  brand,
  model,
  code,
  client_code,
  employer,
  rawData,
  notes,
  manufactureYear,
  kilometersDriven,
  isDone,
  isPresent,
  images,
  voiceNotes,
  projectId,
  parent,
  createdBy,
  updatedBy,
}) {

const incomingRawData =
  rawData && typeof rawData === "object" && !Array.isArray(rawData)
    ? rawData
    : {};

const normalizedQuantity = normalizeQuantity(quantity);

const finalNormalizedData =
  cleanNormalizedData(normalizedData);

const normalizedNewAssetLocation =
  assetType === "vehicle"
    ? null
    : normalizeLocation(newAssetLocation);

const finalRawData = cleanRawData(incomingRawData);

const normalizedNotes = normalizeNotes(notes);
const valTechId = await getNextValTechId();
    const asset = new Asset({
      name,
      asset_description: asset_description ?? null,

      categoryId: categoryId ?? null,
      category: category ?? null,

      typeId: typeId ?? null,
      type: type ?? null,

      nameId: nameId ?? null,
      asset_source: "تطبيق",
     
      condition: normalizeCondition(condition) ?? "Good",
      assetType: assetType || "other",
      brand: brand ?? null,
      model: model ?? null,
      code: code ?? null,
      manufactureYear: manufactureYear ?? null,
      kilometersDriven: kilometersDriven ?? null,
      normalizedData: finalNormalizedData,
      newAssetLocation: normalizedNewAssetLocation,
      quantity: normalizedQuantity,
      val_tech_id: valTechId,
      client_code:
      normalizeOptionalText(client_code),

      employer:normalizeOptionalText(employer),

      rawData: finalRawData,
      
  updatedBy,
  updatedAt:
    new Date(),

      projectId,
      parent: parent || null,
      createdBy,

      images: normalizeImagesForDb(images || {}),

      voiceNotes: (voiceNotes || []).map((item) => ({
        url: item.url,
        publicId: item.publicId || null,
        duration: item.duration ?? null,
      })),

     hasNotes: normalizedNotes.hasNotes,
notes: normalizedNotes.notes,

      isDone: isDone ?? false,
      isPresent: isPresent ?? true,
      isAssetFolder: true,
    });

    await asset.save();
    await asset.populate("createdBy updatedBy", "fullName email role");

    return mapAsset(asset.toObject());
  },



  async findById(assetId) {
    const asset = await Asset.findById(assetId)
      .populate("createdBy updatedBy", "fullName email role")
      .lean();

    return asset ? mapAsset(asset) : null;
  },

  async findByProjectId(projectId) {
    const assets = await Asset.find({
      projectId,
    })
      .sort({ createdAt: 1 ,  updatedAt: -1, })
      .populate("createdBy updatedBy", "fullName email role")
      .lean();

    return assets.map(mapAsset);
  },

async getRecentAssets(
  projectId,
  {
    page = 1,
    limit = 10,
  } = {},
) {
 const safePage = Math.max(
  Number(page) || 1,
  1,
);

const safeLimit = Math.min(
  Math.max(
    Number(limit) || 10,
    1,
  ),
  30,
);

const skip =
  (safePage - 1) * safeLimit;

  const objectProjectId =
    mongoose.Types.ObjectId.isValid(projectId)
      ? new mongoose.Types.ObjectId(projectId)
      : null;

  if (!objectProjectId) {
    return [];
  }


  const  result = await Asset.aggregate([
    {
      $match: {
        projectId: objectProjectId,
        assetType: "other",

        updatedAt: {
          $type: "date",
        },

        name: {
          $type: "string",
          $ne: "",
        },
      },
    },

    {
      $set: {
        recentNameKey: {
          $toLower: {
            $trim: {
              input: "$name",
            },
          },
        },
      },
    },

    {
      $match: {
        recentNameKey: {
          $ne: "",
        },
      },
    },

    {
      $sort: {
        updatedAt: 1,
        _id: -1,
      },
    },

  
    {
      $group: {
        _id: "$recentNameKey",

        assetId: {
          $first: "$_id",
        },

        latestUpdatedAt: {
          $first: "$updatedAt",
        },
      },
    },

 
    {
      $sort: {
        latestUpdatedAt: -1,
        assetId: -1,
      },
    },

   {
  $facet: {
    metadata: [
      {
        $count: "total",
      },
    ],

    rows: [
      {
        $skip: skip,
      },
      {
        $limit: safeLimit,
      },
    ],
  },
},
  ]);

 const facet =
  result?.[0] || {};

const recentRows =
  Array.isArray(facet.rows)
    ? facet.rows
    : [];

const total =
  Number(
    facet.metadata?.[0]?.total || 0,
  );

if (!recentRows.length) {
  return {
    assets: [],
    page: safePage,
    limit: safeLimit,
    total,
    hasMore: false,
  };
}

  const assetIds =
    recentRows.map((row) => row.assetId);

 
  const assets = await Asset.find({
    _id: {
      $in: assetIds,
    },
  })
    .populate(
      "createdBy updatedBy",
      "fullName email role",
    )
    .lean();

  const assetsById = new Map(
    assets.map((asset) => [
      String(asset._id),
      asset,
    ]),
  );

  const mappedAssets =
  assetIds
    .map((id) =>
      assetsById.get(
        String(id),
      ),
    )
    .filter(Boolean)
    .map(mapAsset);

return {
  assets:
    mappedAssets,

  page:
    safePage,

  limit:
    safeLimit,

  total,

  hasMore:
    skip +
      mappedAssets.length <
    total,
};
},

async markAssetUsed(assetId) {
  const asset =
    await Asset.findByIdAndUpdate(
      assetId,
      {
        $set: {
          updatedAt:
            new Date(),
        },
      },
      {
        new: true,
      },
    )
      .populate(
        "createdBy updatedBy",
        "fullName email role",
      )
      .lean();

  return asset
    ? mapAsset(asset)
    : null;
},
 
async updateById(assetId, updates) {
  delete updates.val_tech_id;
  const asset = await Asset.findById(assetId);
  if (!asset) return null;
    if (updates.asset_description !== undefined) {
    updates.asset_description =
      normalizeAssetDescription(updates.asset_description);
  }

  if (updates.notes !== undefined) {
    const normalizedNotes = normalizeNotes(updates.notes);
    updates.notes = normalizedNotes.notes;
    updates.hasNotes = normalizedNotes.hasNotes;
  }

  if (updates.quantity !== undefined) {
    updates.quantity = normalizeQuantity(updates.quantity);
  }

  if (updates.condition !== undefined) {
  updates.condition = normalizeCondition(updates.condition);
}

 if (updates.normalizedData !== undefined) {
  updates.normalizedData =
    cleanNormalizedData(updates.normalizedData);
}

if (updates.newAssetLocation !== undefined) {
  updates.newAssetLocation =
    normalizeLocation(updates.newAssetLocation);
}

  if (updates.rawData !== undefined) {
    updates.rawData = cleanRawData(updates.rawData);
  }

  if (updates.images !== undefined) {
    updates.images = normalizeImagesForDb(updates.images);
  }

  const normalizeTaxonomyValue = (value) => {
  if (value === undefined) return undefined;

  const text = String(value || "").trim();

  return text || null;
};

if (updates.categoryId !== undefined) {
  updates.categoryId =
    normalizeTaxonomyValue(updates.categoryId);
}

if (updates.category !== undefined) {
  updates.category =
    normalizeTaxonomyValue(updates.category);
}

if (updates.typeId !== undefined) {
  updates.typeId =
    normalizeTaxonomyValue(updates.typeId);
}

if (updates.type !== undefined) {
  updates.type =
    normalizeTaxonomyValue(updates.type);
}

if (updates.nameId !== undefined) {
  updates.nameId =
    normalizeTaxonomyValue(updates.nameId);
}

if (updates.client_code !== undefined) {
  updates.client_code =
    normalizeOptionalText(
      updates.client_code,
    );
}

if (updates.employer !== undefined) {
  updates.employer =
    normalizeOptionalText(
      updates.employer,
    );
}

  Object.keys(updates).forEach((key) => {
    if (updates[key] !== undefined) {
      asset[key] = updates[key];
    }
  });

  await asset.save();
  await asset.populate("createdBy updatedBy", "fullName email role");

  return mapAsset(asset.toObject());
},

  async findByProjectIdAndCode(projectId, code) {
    const asset = await Asset.findOne({
      projectId,
      code,
    })
      .populate("createdBy", "fullName email  role")
      .lean();

    return asset ? mapAsset(asset) : null;
  },

  // ✅ UPDATED FUNCTION NAME
  async findByProjectIdAndParentSubProjectId(
    projectId,
    parent = null
  ) {
    const assets = await Asset.find({
      projectId,
      parent,
    })
      .sort({ createdAt: -1 , updatedAt: -1, })
      .populate("createdBy updatedBy", "fullName email  role")
      .lean();

    return assets.map(mapAsset);
  },

  async searchByProjectId(projectId, search) {
    const assets = await Asset.find({
      projectId,
      name: { $regex: search, $options: "i" },
    })
      .sort({ createdAt: -1 , updatedAt: -1, })
      .populate("createdBy updatedBy", "fullName email  role")
      .lean();

    return assets.map(mapAsset);
  },



async advancedGetRawDataKeyValues({ userId, projectId, key }) {
  const assets = await Asset.find({
    projectId,
  })
    .select("rawData")
    .lean();

  const values = new Set();

  for (const asset of assets) {
    const cleanedRawData = cleanRawData(asset.rawData);
    const value = getNestedValue(cleanedRawData, key);

    if (value === null || value === undefined) continue;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      values.add(String(value).trim());
    }
  }

  return {
    values: Array.from(values).sort(),
  };
},
async advancedSearchContents({
  userId,
  projectId,
  filters = [],
  search,
  filter,
  page = 1,
  limit = 15,
}) {
  const query = {
    projectId,
  };

  if (filter === "done") {
    query.isDone = true;
  }

  if (filter === "incomplete") {
    query.isDone = false;
  }

  const assets = await Asset.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy updatedBy", "fullName email  role")
    .lean();

 const matchedAssets = assets.filter((asset) => {
  const hasFilters = Array.isArray(filters) && filters.length > 0;
  const cleanSearch = search?.trim();

  const matchesSelectedFilters =
    !hasFilters ||
    filters.every(({ key, value }) => {
      const rawValue = getNestedValue(cleanRawData(asset.rawData), key);

      if (rawValue === null || rawValue === undefined) return false;

      return (
        String(rawValue).trim().toLowerCase() ===
        String(value).trim().toLowerCase()
      );
    });

  const matchesSearch =
    !cleanSearch ||
    advancedValueMatches(asset.code, cleanSearch) ||
    advancedValueMatches(asset.name, cleanSearch) ||
    advancedValueMatches(cleanRawData(asset.rawData), cleanSearch);

  return matchesSelectedFilters && matchesSearch;
});

  const start = (page - 1) * limit;
  const paginatedAssets = matchedAssets.slice(start, start + limit);

  return {
    folders: [],
    assets: paginatedAssets.map(mapAsset),
    page,
    limit,
    total: matchedAssets.length,
    hasMore: start + limit < matchedAssets.length,
  };
},

async advancedGetRawDataKeys({ userId, projectId }) {
  const assets = await Asset.find({
    projectId,
    rawData: { $exists: true },
  })
    .select("rawData")
    .lean();

  const keys = new Set();

  for (const asset of assets) {
    extractRawDataKeys(cleanRawData(asset.rawData), "", keys);
  }

  return {
    keys: Array.from(keys).sort(),
  };
},


async getUniqueEmployers(projectId) {
  const assets = await Asset.find({
    projectId,
  })
    .select(
      "employer normalizedData.employer rawData.employer",
    )
    .lean();

  const seen = new Map();

  const addEmployer = (value) => {
    const text =
      typeof value === "string"
        ? value.trim()
        : "";

    if (!text) return;

    const key =
      text.toLowerCase();

    if (!seen.has(key)) {
      seen.set(key, text);
    }
  };

  for (const asset of assets) {
    addEmployer(asset.employer);

    addEmployer(
      asset?.normalizedData
        ?.employer,
    );

    addEmployer(
      asset?.rawData?.employer,
    );
  }

  return Array.from(
    seen.values(),
  ).sort((a, b) =>
    a.localeCompare(b),
  );
},



async getUniqueConditions(projectId) {
  const rows = await Asset.getUniqueConditionsByProject(projectId);

  return rows.map((item) => item.value);
},

async getUniqueConditionsWithCounts(projectId) {
  return Asset.getUniqueConditionsByProject(projectId);
},

async getProjectAssetLocations({
  userId,
  projectId,
  parent,
}) {
  const user =
    await userRepository.findById(userId);

  if (!user) {
    throw new AppError(
      "User not found",
      404,
    );
  }

  await getAccessibleProject(
    projectId,
    user,
  );

  const locations =
    await assetRepository.getUniqueAssetLocations(
      projectId,
      {
        parent,
      },
    );

  return {
    locations,
  };
},

async getUniqueAssetLocations(projectId, options = {}) {
  const query = {
    projectId,
    assetType: "other",
  };

  if (options.parent !== undefined) {
    query.parent = options.parent || null;
  }

  const assets = await Asset.find(query)
    .select("normalizedData.asset_location newAssetLocation")
    .lean();

  const seen = new Map();

  for (const asset of assets) {
    const importedLocation =
      asset?.normalizedData?.asset_location;

    const newLocation =
      asset?.newAssetLocation;

    const addLocation = (value, source) => {
      const text =
        typeof value === "string"
          ? value.trim()
          : "";

      if (!text) return;

      const key = text.toLowerCase();

      if (!seen.has(key)) {
        seen.set(key, {
          value: text,
          source,
        });
      }
    };

    addLocation(
      importedLocation,
      "normalizedData",
    );

    addLocation(
      newLocation,
      "newAssetLocation",
    );
  }

  return Array.from(seen.values()).sort(
    (a, b) =>
      a.value.localeCompare(b.value),
  );
},
async deleteById(assetId) {
  const asset = await Asset.findByIdAndDelete(assetId).lean();
  return asset ? mapAsset(asset) : null;
},

};