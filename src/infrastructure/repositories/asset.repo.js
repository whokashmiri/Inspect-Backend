// infrastructure/repositories/asset.repo.js

import { Asset } from "../../models/Asset.js";

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

  condition: doc.condition ?? null,

  assetType: doc.assetType ?? "other",

  subAssetType: doc.subAssetType ?? null,

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

  createdBy: mapCreatedBy(doc.createdBy),

  images: (doc.images || []).map(mapImage),
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

function normalizeSubAssetType(value) {
  if (value === undefined) return undefined;

  const text = String(value || "")
    .trim()
    .toLowerCase();

  return text || null;
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

export const assetRepository = {
async create({
  name,
  condition,
  assetType,
  subAssetType,
  quantity,
  brand,
  model,
  code,
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
}) {

const incomingRawData =
  rawData && typeof rawData === "object" && !Array.isArray(rawData)
    ? rawData
    : {};

const normalizedQuantity = normalizeQuantity(quantity);

const normalizedSubAssetType =
  normalizeSubAssetType(subAssetType) ??
  (assetType === "vehicle" ? "vehicle" : null);

const finalRawData = cleanRawData(incomingRawData);

const normalizedNotes = normalizeNotes(notes);
    const asset = new Asset({
      name,
     
      condition: normalizeCondition(condition) ?? "Good",
      assetType: assetType || "other",
      brand: brand ?? null,
      model: model ?? null,
      code: code ?? null,
      manufactureYear: manufactureYear ?? null,
      kilometersDriven: kilometersDriven ?? null,
      subAssetType: normalizedSubAssetType,
      quantity: normalizedQuantity,

      rawData: finalRawData,

      projectId,
      parent: parent || null,
      createdBy,

      images: (images || [])
  .filter((item) => item?.url)
  .map((item) => ({
    url: item.url,
    publicId: item.publicId ?? null,
    mediaType: item.mediaType ?? "image",
    mimeType: item.mimeType ?? null,
    duration: item.duration ?? null,
    thumbnailUrl: item.thumbnailUrl ?? null,
  })),

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
    await asset.populate("createdBy", "fullName email role");

    return mapAsset(asset.toObject());
  },



  async findById(assetId) {
    const asset = await Asset.findById(assetId)
      .populate("createdBy", "fullName email role")
      .lean();

    return asset ? mapAsset(asset) : null;
  },

  async findByProjectId(projectId) {
    const assets = await Asset.find({
      projectId,
    })
      .sort({ createdAt: 1 })
      .populate("createdBy", "fullName email role")
      .lean();

    return assets.map(mapAsset);
  },

 
async updateById(assetId, updates) {
  const asset = await Asset.findById(assetId);
  if (!asset) return null;

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

  if (updates.subAssetType !== undefined) {
    updates.subAssetType = normalizeSubAssetType(updates.subAssetType);
  }

  if (updates.rawData !== undefined) {
    updates.rawData = cleanRawData(updates.rawData);
  }

  Object.keys(updates).forEach((key) => {
    if (updates[key] !== undefined) {
      asset[key] = updates[key];
    }
  });

  await asset.save();
  await asset.populate("createdBy", "fullName email role");

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
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email  role")
      .lean();

    return assets.map(mapAsset);
  },

  async searchByProjectId(projectId, search) {
    const assets = await Asset.find({
      projectId,
      name: { $regex: search, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email  role")
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
    .populate("createdBy", "fullName email  role")
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

async getUniqueSubAssetTypes(projectId, options = {}) {
  const rows = await Asset.getUniqueSubAssetTypesByProject(projectId, options);

  return rows.map((item) => item.value);
},




async getUniqueConditions(projectId) {
  const rows = await Asset.getUniqueConditionsByProject(projectId);

  return rows.map((item) => item.value);
},

async getUniqueConditionsWithCounts(projectId) {
  return Asset.getUniqueConditionsByProject(projectId);
},

async renameSubAssetType({
  projectId,
  oldSubAssetType,
  newSubAssetType,
  parent,
}) {
  return Asset.renameSubAssetTypeInProject({
    projectId,
    oldSubAssetType,
    newSubAssetType,
    parent,
  });
},
async deleteById(assetId) {
  const asset = await Asset.findByIdAndDelete(assetId).lean();
  return asset ? mapAsset(asset) : null;
},

};