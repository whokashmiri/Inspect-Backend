
//transaction.repo.js

import { Transaction } from "../../models/transactions.js";

const mapTransaction = (doc) => {
  if (!doc) return null;

  return {
    id: doc._id.toString(),

    assignmentNumber: doc.assignmentNumber,
    authorizationNumber: doc.authorizationNumber,
    assignmentDate: doc.assignmentDate,

    valuationPurpose: doc.valuationPurpose,
    intendedUse: doc.intendedUse,
    valuationBasis: doc.valuationBasis,
    ownershipType: doc.ownershipType,
    valuationHypothesis: doc.valuationHypothesis,

    clientId: doc.clientId,
    branch: doc.branch,
    templateId: doc.templateId,

    templateFieldValues: doc.templateFieldValues,
    evalData: doc.evalData,

    priority: doc.priority,
    attachmentsCount: doc.attachmentsCount,
    imagesCount: doc.imagesCount,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const transactionRepository = {
 async findAll(options = {}) {
    const query = Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(options.limit || 100);

    if (options.session) query.session(options.session);

    const transactions = await query.lean();

    return transactions.map(mapTransaction);
  },

  async findById(id, options = {}) {
    if (!id) return null;

    const query = Transaction.findById(id);

    if (options.session) query.session(options.session);

    const transaction = await query.lean();

    return mapTransaction(transaction);
  },

  async updateInspectionData(id, payload, options = {}) {
    const update = {};

    if (payload.buildingCondition !== undefined) {
      update["evalData.buildingCondition"] = payload.buildingCondition;
    }

    if (payload.surroundingEnvironment !== undefined) {
      update["evalData.surroundingEnvironment"] =
        payload.surroundingEnvironment;
    }

    if (payload.availableServices !== undefined) {
      update["evalData.availableServices"] = payload.availableServices;
    }

    if (payload.propertyType !== undefined) {
      update["evalData.propertyType"] = payload.propertyType;
    }

    const query = Transaction.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    if (options.session) query.session(options.session);

    const transaction = await query.lean();

    return mapTransaction(transaction);
  },

  async incrementImagesCount(id, count, options = {}) {
    const query = Transaction.findByIdAndUpdate(
      id,
      {
        $inc: {
          imagesCount: count,
        },
      },
      { new: true }
    );

    if (options.session) query.session(options.session);

    const transaction = await query.lean();

    return mapTransaction(transaction);
  },
};