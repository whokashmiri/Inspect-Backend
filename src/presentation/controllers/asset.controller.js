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
      manufactureYear: req.body.manufactureYear || null,
      kilometersDriven: req.body.kilometersDriven || null,
      imageFiles: req.files?.images || [],
      voiceNoteFiles: req.files?.voiceNotes || [],
    });

    return res.status(201).json(result);
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