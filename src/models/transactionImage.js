import mongoose from "mongoose";

const transactionMediaSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      index: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
    },

    name: String,
    originalName: String,

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    mimeType: String,
    size: Number,

    duration: Number,
    width: Number,
    height: Number,

    thumbnailUrl: String,

    sortIndex: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: {
      createdAt: "uploadedAt",
      updatedAt: "updatedAt",
    },
    collection: "transaction_images",
  }
);

export const TransactionMedia =
  mongoose.models.TransactionMedia ||
  mongoose.model("TransactionMedia", transactionMediaSchema, "transaction_images");