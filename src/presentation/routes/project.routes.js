// project.routes.js
import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, projectController.list);
router.post("/", authenticate, projectController.create);

/**
 * Offline sync routes
 * Keep these before other dynamic nested routes.
 */
router.get(
  "/:projectId/offline-manifest",
  authenticate,
  projectController.offlineManifest
);

router.get(
  "/:projectId/offline-changes",
  authenticate,
  projectController.offlineChanges
);

router.patch(
  "/:projectId/workflow",
  authenticate,
  projectController.updateWorkflow
);

router.get(
  "/:projectId/locations",
  authenticate,
  projectController.listLocations
);

router.get(
  "/:projectId/inspector-files",
  authenticate,
  projectController.listInspectorFiles
);

router.get(
  "/:projectId/inspector-files/:fileId/download",
  authenticate,
  projectController.downloadInspectorFile
);

router.get(
  "/:projectId/inspector-files/:fileId",
  authenticate,
  projectController.getInspectorFile
);

export default router;