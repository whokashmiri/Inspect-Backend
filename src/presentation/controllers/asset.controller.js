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
    const result = await folderAssetService.createAsset({
      userId: req.userId,
      projectId: req.params.projectId,
      folderId: req.body.folderId || null,
      name: req.body.name,
      serialNumber: req.body.serialNumber,
      writtenDescription: req.body.writtenDescription,
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