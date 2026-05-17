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

     // ADD THIS
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },

    // ADD THIS
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ADD THIS
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    isOpened: {
      type: Boolean,
      default: false,
    },

    // OPTIONAL BUT VERY USEFUL FOR OFFLINE
    lastSyncedAt: {
      type: Date,
      default: null,
    },

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