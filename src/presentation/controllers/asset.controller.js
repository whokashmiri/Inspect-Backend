// controllers/asset.controller.js
import { folderAssetService } from "../../application/folder/asset.service.js";

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
      folderId: req.body.folderId || null,
      name: req.body.name,
      writtenDescription: req.body.writtenDescription || null,
      condition: req.body.condition || null,
      assetType: req.body.assetType || "Other",
      brand: req.body.brand || null,
      model: req.body.model || null,
      manufactureYear: req.body.manufactureYear || null,
      kilometersDriven: req.body.kilometersDriven || null,
      isDone: req.body.isDone ?? false,
      imageFiles: req.files?.images || [],

      voiceNoteFiles: req.files?.voiceNotes || [],
    });

    return res.status(201).json(result);
  },

 async updateAsset(req, res) {
  console.log("isDone req.body:", req.body.isDone);
  console.log("isDone req.files:", req.files);

 const result = await folderAssetService.updateAsset({
  userId: req.userId,
  assetId: req.params.assetId,
  writtenDescription:
    req.body.writtenDescription === undefined
      ? undefined
      : req.body.writtenDescription,
  condition:
    req.body.condition === undefined ? undefined : req.body.condition,
  assetType:
    req.body.assetType === undefined ? undefined : req.body.assetType,
  brand:
    req.body.brand === undefined ? undefined : req.body.brand,
  model:
    req.body.model === undefined ? undefined : req.body.model,
  manufactureYear:
    req.body.manufactureYear === undefined
      ? undefined
      : req.body.manufactureYear,
  kilometersDriven:
    req.body.kilometersDriven === undefined
      ? undefined
      : req.body.kilometersDriven,
  isDone:
    req.body.isDone === undefined
      ? undefined
      : req.body.isDone,
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
};