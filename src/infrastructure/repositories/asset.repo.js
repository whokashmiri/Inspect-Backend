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
  writtenDescription: doc.writtenDescription ?? null,
  condition: doc.condition ?? null,
  assetType: doc.assetType ?? "other",
  brand: doc.brand ?? null,
  model: doc.model ?? null,
  code: doc.code ?? null,
  manufactureYear: doc.manufactureYear ?? null,
  kilometersDriven: doc.kilometersDriven ?? null,
  isDone: doc.isDone ?? false,
  isPresent: doc.isPresent ?? true,

  rawData: doc.rawData ?? {},

  // ✅ NEW STRUCTURE
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


export const assetRepository = {
  async create({
    name,
    writtenDescription,
    condition,
    assetType,
    brand,
    model,
    code,
    rawData,
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
    const asset = new Asset({
      name,
      writtenDescription,
      condition: condition ?? null,
      assetType: assetType || "other",
      brand: brand ?? null,
      model: model ?? null,
      code: code ?? null,
      manufactureYear: manufactureYear ?? null,
      kilometersDriven: kilometersDriven ?? null,
      rawData: rawData ?? {},

      projectId,
      parent: parent || null,
      createdBy,

      images: (images || []).map((item) => ({
        url: item.url,
        publicId: item.publicId || null,
      })),

      voiceNotes: (voiceNotes || []).map((item) => ({
        url: item.url,
        publicId: item.publicId || null,
        duration: item.duration ?? null,
      })),

      isDone: isDone ?? false,
      isPresent: isPresent ?? true,
      isAssetFolder: true,
    });

    await asset.save();
    await asset.populate("createdBy", "fullName email");

    return mapAsset(asset.toObject());
  },

  async findById(assetId) {
    const asset = await Asset.findById(assetId)
      .populate("createdBy", "fullName email")
      .lean();

    return asset ? mapAsset(asset) : null;
  },

  async updateById(assetId, updates) {
    const asset = await Asset.findById(assetId);
    if (!asset) return null;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        asset[key] = updates[key];
      }
    });

    await asset.save();
    await asset.populate("createdBy", "fullName email");

    return mapAsset(asset.toObject());
  },

  async findByProjectIdAndCode(projectId, code) {
    const asset = await Asset.findOne({
      projectId,
      code,
    })
      .populate("createdBy", "fullName email")
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
      .populate("createdBy", "fullName email")
      .lean();

    return assets.map(mapAsset);
  },

  async searchByProjectId(projectId, search) {
    const assets = await Asset.find({
      projectId,
      name: { $regex: search, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email")
      .lean();

    return assets.map(mapAsset);
  },




async advancedSearchContents({
  userId,
  projectId,
  key,
  search,
  filter,
  page = 1,
  limit = 15,
}) {
  const query = {
    projectId,
    rawData: { $exists: true },
  };

  if (filter === "done") {
    query.isDone = true;
  }

  if (filter === "incomplete") {
    query.isDone = false;
  }

  const assets = await Asset.find(query)
    .sort({ createdAt: -1 })
    .populate("createdBy", "fullName email")
    .lean();

  const matchedAssets = assets.filter((asset) => {
    if (key) {
      const value = getNestedValue(asset.rawData, key);
      return advancedValueMatches(value, search);
    }

    return advancedValueMatches(asset.rawData, search);
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
    extractRawDataKeys(asset.rawData, "", keys);
  }

  return {
    keys: Array.from(keys).sort(),
  };
},
  

};