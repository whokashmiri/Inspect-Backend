import express from "express";

import { transactionController } from "../controllers/transaction.controller.js";
import { transactionMediaController } from "../controllers/transactionImage.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Transactions
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  authenticate,
  transactionController.listTransactions
);


/*
|--------------------------------------------------------------------------
| Offline Download Manifest
|--------------------------------------------------------------------------
*/

router.get(
  "/company/download",
  authenticate,
  transactionController.downloadCompanyTransactions
);



/*
|--------------------------------------------------------------------------
| Company Transactions (Paginated)
|--------------------------------------------------------------------------
*/

router.get(
  "/company",
  authenticate,
  transactionController.listCompanyTransactions
);


router.get(
  "/company/search",
  authenticate,
  transactionController.searchCompanyTransactions
);


router.post(
  "/media/offline",
  authenticate,
  transactionMediaController.getOfflineMedia
);


router.delete(
  "/media/:mediaId",
  authenticate,
  transactionMediaController.deleteMedia
);


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







/*
|--------------------------------------------------------------------------
| Transaction Details
|--------------------------------------------------------------------------
*/

router.get(
  "/:transactionId",
  authenticate,
  transactionController.getTransactionDetails
);

/*
|--------------------------------------------------------------------------
| Mark Transaction Opened
|--------------------------------------------------------------------------
*/

router.patch(
  "/:transactionId/open",
  authenticate,
  transactionController.markTransactionOpened
);

/*
|--------------------------------------------------------------------------
| Inspection Data
|--------------------------------------------------------------------------
*/

router.patch(
  "/:transactionId/inspection-data",
  authenticate,
  transactionController.updateInspectionData
);

/*
|--------------------------------------------------------------------------
| Transaction Media
|--------------------------------------------------------------------------
*/






export default router;