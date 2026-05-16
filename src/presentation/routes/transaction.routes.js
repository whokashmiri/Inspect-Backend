import express from "express";

import { transactionController } from "../controllers/transaction.controller.js";
import { transactionMediaController } from "../controllers/transactionImage.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authenticate, transactionController.listTransactions);

router.get(
  "/:transactionId/media",
  authenticate,
  transactionMediaController.getMedia
);

router.post(
  "/:transactionId/media",
  authenticate,
  transactionMediaController.addMedia
);

router.delete(
  "/media/:mediaId",
  authenticate,
  transactionMediaController.deleteMedia
);

router.patch(
  "/:transactionId/inspection-data",
  authenticate,
  transactionController.updateInspectionData
);

router.get(
  "/:transactionId",
  authenticate,
  transactionController.getTransactionDetails
);

export default router;