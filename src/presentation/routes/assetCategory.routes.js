import { Router } from "express";
import { assetCategoryController } from "../controllers/assetCategory.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();


// ALL CATEGORY DATA
router.get(
  "/",
  authenticate,
  asyncWrap(assetCategoryController.getAll)
);


// CATEGORIES
router.get(
  "/categories",
  authenticate,
  asyncWrap(assetCategoryController.getCategories)
);


// TYPES BY CATEGORY
router.get(
  "/categories/:categoryId/types",
  authenticate,
  asyncWrap(assetCategoryController.getTypesByCategoryId)
);


// NAMES BY TYPE
router.get(
  "/types/:typeId/names",
  authenticate,
  asyncWrap(assetCategoryController.getNamesByTypeId)
);

router.post(
  "/categories",
  authenticate,
  asyncWrap(
    assetCategoryController
      .createCategory,
  ),
);

router.post(
  "/categories/:categoryId/types",
  authenticate,
  asyncWrap(
    assetCategoryController
      .createType,
  ),
);

router.post(
  "/types/:typeId/names",
  authenticate,
  asyncWrap(
    assetCategoryController
      .createName,
  ),
);


function asyncWrap(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}


export default router;