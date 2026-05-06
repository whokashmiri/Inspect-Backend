// folder.routes.js
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncWrap } from "../middleware/asyncWrap.js";
import { validate } from "../middleware/validate.middleware.js";
// import { uploadAssetMedia } from "../middleware/upload.middleware.js";
import { folderAssetController } from "../controllers/asset.controller.js";
import {
  createFolderSchema,
  createAssetSchema,
  updateAssetSchema,
} from "../validators/auth.validators.js";

const router = Router();

router.get(
  "/:projectId/contents/advanced-keys",
  authenticate,
  asyncWrap(folderAssetController.advancedGetRawDataKeys)
);


router.get(
  "/:projectId/contents/advanced-key-values",
  authenticate,
  asyncWrap(folderAssetController.advancedGetRawDataKeyValues)
);

router.get(
  "/:projectId/contents/advanced-search",
  authenticate,
  asyncWrap(folderAssetController.advancedSearchContents)
);




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
  validate(createAssetSchema),
  asyncWrap(folderAssetController.createAsset)
);

router.get(
  "/:projectId/assets/by-code",
  authenticate,
  asyncWrap(folderAssetController.getAssetByCode)
);
router.patch(
  "/assets/:assetId",
  authenticate,
  validate(updateAssetSchema),
  asyncWrap(folderAssetController.updateAsset)
);

router.delete(
  "/assets/:assetId",
  authenticate,
  asyncWrap(folderAssetController.deleteAsset)
);
export default router;