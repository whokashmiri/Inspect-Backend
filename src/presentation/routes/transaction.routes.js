import express from "express";

import { transactionController } from "../controllers/transaction.controller.js";
import { transactionMediaController } from "../controllers/transactionImage.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();
router.get("/", authenticate , transactionController.listTransactions);


router.patch(
  "/:transactionId/inspection-data",
  transactionController.updateInspectionData
);

router.post("/:transactionId/media", authenticate, transactionMediaController.addMedia);

router.get("/:transactionId/media", authenticate , transactionMediaController.getMedia);

router.delete("/media/:mediaId", authenticate , transactionMediaController.deleteMedia);

export default router;


