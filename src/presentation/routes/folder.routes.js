// folder.routes.js
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncWrap } from "../middleware/asyncWrap.js";
import { validate } from "../middleware/validate.middleware.js";
import { uploadAssetMedia } from "../middleware/upload.middleware.js";
import { folderAssetController } from "../controllers/asset.controller.js";
import {
  createFolderSchema,
  createAssetSchema,
  updateAssetSchema,
} from "../validators/auth.validators.js";

const router = Router();

router.get(
  "/:projectId/contents",
  authenticate,
  asyncWrap(folderAssetController.listContents)
);

router.post(
  "/:projectId/folders",
  authenticate,
  validate(createFolderSchema),
  asyncWrap(folderAssetController.createFolder)
);

router.post(
  "/:projectId/assets",
  authenticate,
  uploadAssetMedia,
  validate(createAssetSchema),
  asyncWrap(folderAssetController.createAsset)
);

router.patch(
  "/assets/:assetId",
  authenticate,
  uploadAssetMedia,
  validate(updateAssetSchema),
  asyncWrap(folderAssetController.updateAsset)
);

router.get(
  "/:projectId/assets/by-code",
  authenticate,
  asyncWrap(folderAssetController.getAssetByCode)
);

export default router;