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
  delete cleaned.subAssetType;
  delete cleaned.customAssetType;

  return cleaned;
};

const normalizeOptionalText = (value, fallback = undefined) => {
  if (value === undefined || value === null) return fallback;

  const text = String(value).trim();

  return text || fallback;
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
  const rawData = cleanRawData(parseRawData(req.body.rawData));

  const result = await folderAssetService.createAsset({
    userId: req.userId,
    projectId: req.params.projectId,

    parent: req.body.parent ?? req.body.folderId ?? null,

    code: req.body.code || null,
    name: req.body.name,

    condition: normalizeNullableText(req.body.condition, undefined),

    assetType: normalizeAssetType(req.body.assetType, "other"),

   subAssetType: normalizeOptionalText(req.body.subAssetType, undefined),

quantity: parseQuantity(req.body.quantity, undefined),

    rawData,

    brand: req.body.brand || null,
    model: req.body.model || null,
    manufactureYear: req.body.manufactureYear || null,
    kilometersDriven: req.body.kilometersDriven || null,

    isDone: parseBoolean(req.body.isDone, false),
    isPresent: parseBoolean(req.body.isPresent, true),

    notes: req.body.notes || null,

    images: Array.isArray(req.body.images) ? req.body.images : [],
    voiceNotes: Array.isArray(req.body.voiceNotes) ? req.body.voiceNotes : [],
  });

  return res.status(201).json(result);
},
async updateAsset(req, res) {
  const rawData =
  req.body.rawData === undefined
    ? undefined
    : cleanRawData(parseRawData(req.body.rawData));

  const result = await folderAssetService.updateAsset({
    userId: req.userId,
    assetId: req.params.assetId,

    name: req.body.name === undefined ? undefined : req.body.name,

    condition: normalizeNullableText(req.body.condition, undefined),

    assetType:
      req.body.assetType === undefined
        ? undefined
        : normalizeAssetType(req.body.assetType),

   subAssetType: normalizeNullableText(req.body.subAssetType, undefined),

quantity:
  req.body.quantity === undefined
    ? undefined
    : parseQuantity(req.body.quantity, undefined),

    rawData,

    brand: req.body.brand === undefined ? undefined : req.body.brand,
    model: req.body.model === undefined ? undefined : req.body.model,
    code: req.body.code === undefined ? undefined : req.body.code,

    manufactureYear:
      req.body.manufactureYear === undefined
        ? undefined
        : req.body.manufactureYear,

    kilometersDriven:
      req.body.kilometersDriven === undefined
        ? undefined
        : req.body.kilometersDriven,

    isDone: parseBoolean(req.body.isDone, undefined),
    isPresent: parseBoolean(req.body.isPresent, undefined),

    notes: req.body.notes === undefined ? undefined : req.body.notes,

    images: Array.isArray(req.body.images) ? req.body.images : [],
    voiceNotes: Array.isArray(req.body.voiceNotes) ? req.body.voiceNotes : [],
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

async getProjectSubAssetTypes(req, res) {
  const result = await folderAssetService.getProjectSubAssetTypes({
    userId: req.userId,
    projectId: req.params.projectId,
  });

  return res.status(200).json(result);
},

  async renameProjectSubAssetType(req, res) {
  const result = await folderAssetService.renameProjectSubAssetType({
    userId: req.userId,
    projectId: req.params.projectId,
    oldSubAssetType: req.body.oldSubAssetType,
    newSubAssetType: req.body.newSubAssetType,
    parent: req.body.parent,
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

async deleteAsset(req, res) {
  const result = await folderAssetService.deleteAsset({
    userId: req.userId,
    assetId: req.params.assetId,
  });

  return res.status(200).json(result);
},
};