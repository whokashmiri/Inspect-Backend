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
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const result = await folderAssetService.createAsset({
      userId: req.userId,
      projectId: req.params.projectId,

      // new field
      parent:
        req.body.parent ?? req.body.folderId ?? null,

      code: req.body.code || null,
      name: req.body.name,
      writtenDescription: req.body.writtenDescription || null,

      condition:
        req.body.condition === undefined || req.body.condition === ""
          ? undefined
          : req.body.condition,

      assetType: normalizeAssetType(req.body.assetType, "other"),

      brand: req.body.brand || null,
      model: req.body.model || null,
      manufactureYear: req.body.manufactureYear || null,
      kilometersDriven: req.body.kilometersDriven || null,

      isDone: parseBoolean(req.body.isDone, false),
      isPresent: parseBoolean(req.body.isPresent, true),

      imageFiles: req.files?.images || [],
      voiceNoteFiles: req.files?.voiceNotes || [],
    });

    return res.status(201).json(result);
  },

  async updateAsset(req, res) {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const result = await folderAssetService.updateAsset({
      userId: req.userId,
      assetId: req.params.assetId,

      name: req.body.name === undefined ? undefined : req.body.name,

      writtenDescription:
        req.body.writtenDescription === undefined
          ? undefined
          : req.body.writtenDescription,

      condition:
        req.body.condition === undefined || req.body.condition === ""
          ? undefined
          : req.body.condition,

      assetType:
        req.body.assetType === undefined
          ? undefined
          : normalizeAssetType(req.body.assetType),

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

      imageFiles: req.files?.images || [],
      voiceNoteFiles: req.files?.voiceNotes || [],
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
    console.log("REQ QUERY CODE:", req.query.code);
    console.log("REQ PARAM PROJECT:", req.params.projectId);

    const result = await folderAssetService.getAssetByCode({
      userId: req.userId,
      projectId: req.params.projectId,
      code: req.query.code,
    });

    return res.status(200).json(result);
  },

 async advancedSearchContents(req, res) {
  const result = await folderAssetService.advancedSearchContents({
    userId: req.userId,
    projectId: req.params.projectId,
    key: req.query.key?.trim() || null,
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
};