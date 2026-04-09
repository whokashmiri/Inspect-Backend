// project.routes.js

import { Router } from "express";
import { projectController } from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, projectController.list);
router.post("/", authenticate, projectController.create);

export default router;