import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncWrap } from "../middleware/asyncWrap.js";
import { mediaController } from "../controllers/media.controller.js";

const router = Router();

router.post(
  "/sign-upload",
  authenticate,
  asyncWrap(mediaController.signUpload)
);

export default router;