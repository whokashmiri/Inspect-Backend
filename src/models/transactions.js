import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
     {
    
    assignmentNumber: String,
    authorizationNumber: String,
    assignmentDate: String,

    valuationPurpose: String,
    intendedUse: String,
    valuationBasis: String,
    ownershipType: String,
    valuationHypothesis: String,

    clientId: String,
    branch: String,
    templateId: String,

    templateFieldValues: {
      type: Object,
      default: {},
    },

    evalData: {
      type: Object,
      default: {},
    },

    priority: {
      type: String,
      default: "normal",
    },

    attachmentsCount: {
      type: Number,
      default: 0,
    },

    imagesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "transactions",
  }
);

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema, "transactions");