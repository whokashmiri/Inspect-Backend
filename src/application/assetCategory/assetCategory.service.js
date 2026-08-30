import { assetCategoryRepository } from "../../infrastructure/repositories/assetCategory.repo.js";
import crypto from "crypto";

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

  async createCategory({
  label,
}) {
  const cleanLabel =
    String(label || "").trim();

  if (!cleanLabel) {
    throw new Error(
      "Category label is required",
    );
  }

  const existing =
    await assetCategoryRepository
      .findCategories();

  const duplicate =
    existing.find(
      (item) =>
        item.label
          .trim()
          .toLowerCase() ===
        cleanLabel.toLowerCase(),
    );

  if (duplicate) {
    return duplicate;
  }

  const category =
    await assetCategoryRepository
      .addCategory({
        id: crypto.randomUUID(),
        label: cleanLabel,
      });

  if (!category) {
    throw new Error(
      "Asset category document not found",
    );
  }

  return category;
},

async createType({
  categoryId,
  label,
}) {
  const cleanLabel =
    String(label || "").trim();

  if (!categoryId) {
    throw new Error(
      "categoryId is required",
    );
  }

  if (!cleanLabel) {
    throw new Error(
      "Type label is required",
    );
  }

  const category =
    await assetCategoryRepository
      .findCategoryById(
        categoryId,
      );

  if (!category) {
    throw new Error(
      "Category not found",
    );
  }

  const existing =
    await assetCategoryRepository
      .findTypesByCategoryId(
        categoryId,
      );

  const duplicate =
    existing.find(
      (item) =>
        item.label
          .trim()
          .toLowerCase() ===
        cleanLabel.toLowerCase(),
    );

  if (duplicate) {
    return duplicate;
  }

  const type =
    await assetCategoryRepository
      .addType({
        id: crypto.randomUUID(),
        categoryId,
        label: cleanLabel,
      });

  if (!type) {
    throw new Error(
      "Could not create type",
    );
  }

  return type;
},

async createName({
  typeId,
  label,
}) {
  const cleanLabel =
    String(label || "").trim();

  if (!typeId) {
    throw new Error(
      "typeId is required",
    );
  }

  if (!cleanLabel) {
    throw new Error(
      "Name label is required",
    );
  }

  const type =
    await assetCategoryRepository
      .findTypeById(
        typeId,
      );

  if (!type) {
    throw new Error(
      "Type not found",
    );
  }

  const existing =
    await assetCategoryRepository
      .findNamesByTypeId(
        typeId,
      );

  const duplicate =
    existing.find(
      (item) =>
        item.label
          .trim()
          .toLowerCase() ===
        cleanLabel.toLowerCase(),
    );

  if (duplicate) {
    return duplicate;
  }

  const name =
    await assetCategoryRepository
      .addName({
        id: crypto.randomUUID(),
        typeId,
        label: cleanLabel,
      });

  if (!name) {
    throw new Error(
      "Could not create asset name",
    );
  }

  return name;
},
};