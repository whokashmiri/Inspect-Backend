import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const typeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    categoryId: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const nameSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    typeId: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const assetCategorySchema = new mongoose.Schema(
  {
    categories: {
      type: [categorySchema],
      default: [],
    },

    types: {
      type: [typeSchema],
      default: [],
    },

    names: {
      type: [nameSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: "asset_description",
  }
);

export default mongoose.model('AssetCategory', assetCategorySchema);