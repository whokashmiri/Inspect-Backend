// controllers/asset.controller.js
import { folderAssetService } from "../../application/folder/asset.service.js";

const parseBoolean = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return fallback;
};



const normalizeAssetType = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === "") return fallback;

  const normalized = String(value).trim().toLowerCase();
  return normalized === "vehicle" ? "vehicle" : "other";
};

const normalizeNullableText = (value, fallback = undefined) => {
  if (value === undefined) return fallback;
  if (value === null) return null;

  const text = String(value).trim();

  return text || null;
};

const parseQuantity = (value, fallback = undefined) => {
  if (value === undefined || value === null || value === "") return fallback;

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 1) {
    return fallback;
  }

  return Math.floor(numberValue);
};

const parseObject = (value) => {
  if (!value) return {};

  if (
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      return parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
};

const parseRawData = (value) => {
  if (!value) return {};

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
};


const cleanRawData = (rawData) => {
  const cleaned =
    rawData && typeof rawData === "object" && !Array.isArray(rawData)
      ? { ...rawData }
      : {};

  delete cleaned.quantity;
  // delete cleaned.subAssetType;
  delete cleaned.customAssetType;

  return cleaned;
};

const normalizeOptionalText = (value, fallback = undefined) => {
  if (value === undefined || value === null) return fallback;

  const text = String(value).trim();

  return text || fallback;
};

// --- Image helpers -----------------------------------------------------
// The Asset model now stores images as a structured object instead of a
// flat array:
//   Vehicle assets: { plate, details, odometer, other[] }
//   Other assets:   { details, brand, other[] }
// Slots that don't apply to the asset's assetType are cleared automatically
// by the model's pre("validate") hook, so the controller doesn't need to
// know the assetType to normalize incoming image data — it just sanitizes
// whichever slots were sent.

const normalizeSingleImage = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const url = typeof value.url === "string" ? value.url.trim() : "";
  if (!url) return null;

  return {
    url,
    publicId: normalizeNullableText(value.publicId, null),
    mediaType: value.mediaType === "video" ? "video" : "image",
    mimeType: normalizeNullableText(value.mimeType, null),
    duration: Number.isFinite(Number(value.duration))
      ? Number(value.duration)
      : null,
    thumbnailUrl: normalizeNullableText(value.thumbnailUrl, null),
  };
};

const normalizeImageArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map(normalizeSingleImage).filter(Boolean);
};

// Accepts the new structured shape: { plate, details, odometer, brand, other }
// For backward compatibility, if a plain array is sent (old format), it is
// treated as the "other" slot so existing clients don't hard-break.
//
// On create: pass fallback = {} so a brand-new asset always gets a fully
// shaped images object.
// On update: pass fallback = undefined so omitting "images" leaves existing
// images untouched.
const normalizeImages = (value, fallback = undefined) => {
  if (value === undefined) return fallback;

  if (Array.isArray(value)) {
    return {
      main: null,
      plate: null,
      details: null,
      odometer: null,
      brand: null,
      other: normalizeImageArray(value),
    };
  }

  if (!value || typeof value !== "object") {
    return {
      main: null,
      plate: null,
      details: null,
      odometer: null,
      brand: null,
      other: [],
    };
  }

  return {
    main: normalizeSingleImage(value.main),
    plate: normalizeSingleImage(value.plate),
    details: normalizeSingleImage(value.details),
    odometer: normalizeSingleImage(value.odometer),
    brand: normalizeSingleImage(value.brand),
    other: normalizeImageArray(value.other),
  };
};

const normalizeImagesPartial = (
  value,
  fallback = undefined,
) => {
  if (value === undefined) {
    return fallback;
  }

  if (Array.isArray(value)) {
    return {
      other:
        normalizeImageArray(value),
    };
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return fallback;
  }

  const result = {};

  if ("main" in value) {
    result.main =
      normalizeSingleImage(value.main);
  }

  if ("plate" in value) {
    result.plate =
      normalizeSingleImage(value.plate);
  }

  if ("details" in value) {
    result.details =
      normalizeSingleImage(value.details);
  }

  if ("odometer" in value) {
    result.odometer =
      normalizeSingleImage(value.odometer);
  }

  if ("brand" in value) {
    result.brand =
      normalizeSingleImage(value.brand);
  }

  if ("other" in value) {
    result.other =
      normalizeImageArray(value.other);
  }

  return result;
};


export const folderAssetController = {
  async createFolder(req, res) {
    const result = await folderAssetService.createFolder({
      userId: req.userId,
      projectId: req.params.projectId,
      parentId: req.body.parentId,
      name: req.body.name,
    });

    return res.status(201).json(result);
  },




 async createAsset(req, res) {

  const normalizedData =
  req.body.normalizedData === undefined
    ? undefined
    : parseObject(
        req.body.normalizedData,
      );
  const rawData = cleanRawData(parseRawData(req.body.rawData));

 const result = await folderAssetService.createAsset({
  userId: req.userId,
  projectId: req.params.projectId,

  parent: req.body.parent ?? req.body.folderId ?? null,

  code: req.body.code || null,
  name: req.body.name,

  client_code: normalizeNullableText(
  req.body.client_code,
  null,
),

employer: normalizeNullableText(
  req.body.employer,
  null,
),

  categoryId: normalizeNullableText(req.body.categoryId, null),
  category: normalizeNullableText(req.body.category, null),

  typeId: normalizeNullableText(req.body.typeId, null),
  type: normalizeNullableText(req.body.type, null),

  nameId: normalizeNullableText(req.body.nameId, null),

  normalizedData,

newAssetLocation:
  normalizeNullableText(
    req.body.newAssetLocation,
    null,
  ),

  condition: normalizeNullableText(req.body.condition, undefined),

  assetType: normalizeAssetType(req.body.assetType, "other"),



  quantity: parseQuantity(
    req.body.quantity,
    undefined,
  ),

  rawData,

  brand: req.body.brand || null,
  model: req.body.model || null,
  manufactureYear: req.body.manufactureYear || null,
  kilometersDriven: req.body.kilometersDriven || null,

  isDone: parseBoolean(req.body.isDone, false),
  isPresent: parseBoolean(req.body.isPresent, true),

  notes: req.body.notes || null,

  images: normalizeImages(req.body.images, {
    main: null,
    plate: null,
    details: null,
    odometer: null,
    brand: null,
    other: [],
  }),

  voiceNotes:
    req.body.voiceNotes === undefined
      ? undefined
      : Array.isArray(req.body.voiceNotes)
        ? req.body.voiceNotes
        : [],
});
  return res.status(201).json(result);
},
async updateAsset(req, res) {

  const normalizedData =
  req.body.normalizedData === undefined
    ? undefined
    : parseObject(
        req.body.normalizedData,
      );
  const rawData =
  req.body.rawData === undefined
    ? undefined
    : cleanRawData(parseRawData(req.body.rawData));

const result = await folderAssetService.updateAsset({
  userId: req.userId,
  assetId: req.params.assetId,

  name:
    req.body.name === undefined
      ? undefined
      : req.body.name,

      client_code:
  req.body.client_code === undefined
    ? undefined
    : normalizeNullableText(
        req.body.client_code,
        null,
      ),

employer:
  req.body.employer === undefined
    ? undefined
    : normalizeNullableText(
        req.body.employer,
        null,
      ),

  categoryId:
    req.body.categoryId === undefined
      ? undefined
      : normalizeNullableText(req.body.categoryId, null),

  category:
    req.body.category === undefined
      ? undefined
      : normalizeNullableText(req.body.category, null),

  typeId:
    req.body.typeId === undefined
      ? undefined
      : normalizeNullableText(req.body.typeId, null),

  type:
    req.body.type === undefined
      ? undefined
      : normalizeNullableText(req.body.type, null),

      normalizedData,

newAssetLocation:
  req.body.newAssetLocation === undefined
    ? undefined
    : normalizeNullableText(
        req.body.newAssetLocation,
        null,
      ),

  nameId:
    req.body.nameId === undefined
      ? undefined
      : normalizeNullableText(req.body.nameId, null),

  condition: normalizeNullableText(
    req.body.condition,
    undefined,
  ),

  assetType:
    req.body.assetType === undefined
      ? undefined
      : normalizeAssetType(req.body.assetType),

  

  quantity:
    req.body.quantity === undefined
      ? undefined
      : parseQuantity(
          req.body.quantity,
          undefined,
        ),

  rawData,

  brand:
    req.body.brand === undefined
      ? undefined
      : req.body.brand,

  model:
    req.body.model === undefined
      ? undefined
      : req.body.model,

  code:
    req.body.code === undefined
      ? undefined
      : req.body.code,

  manufactureYear:
    req.body.manufactureYear === undefined
      ? undefined
      : req.body.manufactureYear,

  kilometersDriven:
    req.body.kilometersDriven === undefined
      ? undefined
      : req.body.kilometersDriven,

  isDone: parseBoolean(
    req.body.isDone,
    undefined,
  ),

  isPresent: parseBoolean(
    req.body.isPresent,
    undefined,
  ),

  notes:
    req.body.notes === undefined
      ? undefined
      : req.body.notes,

images: normalizeImagesPartial(
  req.body.images,
  undefined,
),

  voiceNotes:
    req.body.voiceNotes === undefined
      ? undefined
      : Array.isArray(req.body.voiceNotes)
        ? req.body.voiceNotes
        : [],
});

  return res.status(200).json(result);
},

  async listContents(req, res) {
    const result = await folderAssetService.listContents({
      userId: req.userId,
      projectId: req.params.projectId,
      parentId: req.query.parentId || null,
    });

    return res.status(200).json(result);
  },

  async getAssetByCode(req, res) {
    

    const result = await folderAssetService.getAssetByCode({
      userId: req.userId,
      projectId: req.params.projectId,
      code: req.query.code,
    });

    return res.status(200).json(result);
  },

  async advancedGetRawDataKeyValues(req, res) {
  const result = await folderAssetService.advancedGetRawDataKeyValues({
    userId: req.userId,
    projectId: req.params.projectId,
    key: req.query.key?.trim(),
  });

  return res.status(200).json(result);
},

async advancedSearchContents(req, res) {
  let filters = [];

  if (req.query.filters) {
    try {
      filters = JSON.parse(req.query.filters);
    } catch {
      filters = [];
    }
  }


  

  const result = await folderAssetService.advancedSearchContents({
    userId: req.userId,
    projectId: req.params.projectId,
    filters,
    search: req.query.search?.trim() || "",
    filter: req.query.filter || "all",
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 15),
  });

  return res.status(200).json(result);
},


async advancedGetRawDataKeys(req, res) {
  const result = await folderAssetService.advancedGetRawDataKeys({
    userId: req.userId,
    projectId: req.params.projectId,
  });

  return res.status(200).json(result);
},



async getProjectAssetLocations(req, res) {
  const result =
    await folderAssetService.getProjectAssetLocations({
      userId: req.userId,
      projectId: req.params.projectId,
      parent:
        req.query.parent === undefined
          ? undefined
          : req.query.parent || null,
    });

  return res.status(200).json(result);
},

async getRecentAssets(req, res) {
  const result =
    await folderAssetService.getRecentAssets({
      userId: req.userId,
      projectId: req.params.projectId,
      limit: Number(req.query.limit || 8),
    });

  return res.status(200).json(result);
},

async markAssetUsed(req, res) {
  const result =
    await folderAssetService.markAssetUsed({
      userId: req.userId,
      assetId: req.params.assetId,
    });

  return res.status(200).json(result);
},

async getProjectConditions(req, res) {
  const result = await folderAssetService.getProjectConditions({
    userId: req.userId,
    projectId: req.params.projectId,
  });

  return res.status(200).json(result);
},

async getProjectEmployers(req, res) {
  const result =
    await folderAssetService.getProjectEmployers({
      userId: req.userId,
      projectId: req.params.projectId,
    });

  return res.status(200).json(result);
},

async deleteAsset(req, res) {
  const result = await folderAssetService.deleteAsset({
    userId: req.userId,
    assetId: req.params.assetId,
  });

  return res.status(200).json(result);
},
};