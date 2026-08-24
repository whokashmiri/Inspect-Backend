import mongoose from "mongoose";

const assetSequenceSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    collection: "asset_sequences",
    versionKey: false,
  },
);

export const AssetSequence =
  mongoose.models.AssetSequence ||
  mongoose.model(
    "AssetSequence",
    assetSequenceSchema,
  );