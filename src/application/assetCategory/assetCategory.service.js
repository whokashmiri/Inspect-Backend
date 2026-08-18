import { assetCategoryRepository } from "../../infrastructure/repositories/assetCategory.repo.js";

export const assetCategoryService = {
 async getAll() {
  const data = await assetCategoryRepository.findOne();

  if (!data) {
    return {
      categories: [],
      types: [],
      names: [],
    };
  }

  return data;
},

  async getCategories() {
    return assetCategoryRepository.findCategories();
  },

  async getTypesByCategoryId(categoryId) {
    if (!categoryId) {
      throw new Error("categoryId is required");
    }

    const category =
      await assetCategoryRepository.findCategoryById(categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    return assetCategoryRepository.findTypesByCategoryId(categoryId);
  },

  async getNamesByTypeId(typeId) {
    if (!typeId) {
      throw new Error("typeId is required");
    }

    const type = await assetCategoryRepository.findTypeById(typeId);

    if (!type) {
      throw new Error("Type not found");
    }

    return assetCategoryRepository.findNamesByTypeId(typeId);
  },

  async getCategoryById(categoryId) {
    if (!categoryId) {
      throw new Error("categoryId is required");
    }

    const category =
      await assetCategoryRepository.findCategoryById(categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    return category;
  },

  async getTypeById(typeId) {
    if (!typeId) {
      throw new Error("typeId is required");
    }

    const type = await assetCategoryRepository.findTypeById(typeId);

    if (!type) {
      throw new Error("Type not found");
    }

    return type;
  },

  async getNameById(nameId) {
    if (!nameId) {
      throw new Error("nameId is required");
    }

    const name = await assetCategoryRepository.findNameById(nameId);

    if (!name) {
      throw new Error("Name not found");
    }

    return name;
  },

  async validateSelection(categoryId, typeId, nameId) {
    if (!categoryId) {
      throw new Error("categoryId is required");
    }

    if (!typeId) {
      throw new Error("typeId is required");
    }

    if (!nameId) {
      throw new Error("nameId is required");
    }

    const category =
      await assetCategoryRepository.findCategoryById(categoryId);

    if (!category) {
      throw new Error("Category not found");
    }

    const type = await assetCategoryRepository.findTypeById(typeId);

    if (!type) {
      throw new Error("Type not found");
    }

    if (type.categoryId !== categoryId) {
      throw new Error("Type does not belong to the selected category");
    }

    const name = await assetCategoryRepository.findNameById(nameId);

    if (!name) {
      throw new Error("Name not found");
    }

    if (name.typeId !== typeId) {
      throw new Error("Name does not belong to the selected type");
    }

    return {
      category,
      type,
      name,
    };
  },
};