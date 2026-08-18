import  AssetCategory  from "../../models/AssetCategory.js";

const mapCategory = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    label: item.label,
  };
};

const mapType = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    categoryId: item.categoryId,
    label: item.label,
  };
};

const mapName = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    typeId: item.typeId,
    label: item.label,
  };
};

const mapAssetCategory = (doc) => {
  if (!doc) return null;

  return {
    id: doc._id?.toString(),
    _id: doc._id?.toString(),

    categories: (doc.categories || []).map(mapCategory),
    types: (doc.types || []).map(mapType),
    names: (doc.names || []).map(mapName),

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const assetCategoryRepository = {
async findOne(options = {}) {
  // console.log("[AssetCategory Repo]", {
  //   modelName: AssetCategory.modelName,
  //   collectionName: AssetCategory.collection.name,
  // });

  const count = await AssetCategory.countDocuments();

  // console.log("[AssetCategory Repo] document count:", count);

  const query = AssetCategory.findOne();

  if (options.session) {
    query.session(options.session);
  }

  const document = await query.lean();

  // console.log("[AssetCategory Repo] document:", document ? "FOUND" : "NOT FOUND");

  return mapAssetCategory(document);
},

  async findCategories(options = {}) {
    const query = AssetCategory.findOne().select({
      categories: 1,
    });

    if (options.session) {
      query.session(options.session);
    }

    const document = await query.lean();

    if (!document) {
      return [];
    }

    return (document.categories || []).map(mapCategory);
  },

async findTypesByCategoryId(categoryId, options = {}) {
  const query = AssetCategory.findOne({
    "categories.id": categoryId,
  }).select({
    types: 1,
  });

  if (options.session) {
    query.session(options.session);
  }

  const document = await query.lean();

  if (!document) {
    return [];
  }

  return (document.types || [])
    .filter((item) => item.categoryId === categoryId)
    .map(mapType);
},

  async findNamesByTypeId(typeId, options = {}) {
    const query = AssetCategory.findOne({
      "types.id": typeId,
    }).select({
      names: 1,
    });

    if (options.session) {
      query.session(options.session);
    }

    const document = await query.lean();

    if (!document) {
      return [];
    }

    return (document.names || [])
      .filter((item) => item.typeId === typeId)
      .map(mapName);
  },

  async findCategoryById(categoryId, options = {}) {
    const query = AssetCategory.findOne({
      "categories.id": categoryId,
    }).select({
      categories: 1,
    });

    if (options.session) {
      query.session(options.session);
    }

    const document = await query.lean();

    if (!document) {
      return null;
    }

    const category = document.categories?.find(
      (item) => item.id === categoryId
    );

    return mapCategory(category);
  },

  async findTypeById(typeId, options = {}) {
    const query = AssetCategory.findOne({
      "types.id": typeId,
    }).select({
      types: 1,
    });

    if (options.session) {
      query.session(options.session);
    }

    const document = await query.lean();

    if (!document) {
      return null;
    }

    const type = document.types?.find((item) => item.id === typeId);

    return mapType(type);
  },

  async findNameById(nameId, options = {}) {
    const query = AssetCategory.findOne({
      "names.id": nameId,
    }).select({
      names: 1,
    });

    if (options.session) {
      query.session(options.session);
    }

    const document = await query.lean();

    if (!document) {
      return null;
    }

    const name = document.names?.find((item) => item.id === nameId);

    return mapName(name);
  },
};