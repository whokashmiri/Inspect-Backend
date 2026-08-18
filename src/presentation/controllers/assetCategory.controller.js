import { assetCategoryService } from "../../application/assetCategory/assetCategory.service.js";

export const assetCategoryController = {
  async getAll(req, res) {
    console.log("asset-categories/get");

    const result = await assetCategoryService.getAll();

    res.status(200).json(result);
  },

  async getCategories(req, res) {
    console.log("asset-categories/categories/get");

    const categories = await assetCategoryService.getCategories();

    res.status(200).json({
      categories,
    });
  },

  async getTypesByCategoryId(req, res) {
    console.log("asset-categories/:categoryId/types/get");

    const { categoryId } = req.params;

    const types =
      await assetCategoryService.getTypesByCategoryId(categoryId);

    res.status(200).json({
      types,
    });
  },

  async getNamesByTypeId(req, res) {
    console.log("asset-categories/types/:typeId/names/get");

    const { typeId } = req.params;

    const names =
      await assetCategoryService.getNamesByTypeId(typeId);

    res.status(200).json({
      names,
    });
  },
};