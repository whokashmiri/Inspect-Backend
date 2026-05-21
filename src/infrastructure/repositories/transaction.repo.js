// transaction.repo.js
import mongoose from "mongoose";
import { Transaction } from "../../models/transactions.js";

function toObjectId(value) {
  if (!value) return value;

  const stringValue = value.toString();

  if (mongoose.Types.ObjectId.isValid(stringValue)) {
    return new mongoose.Types.ObjectId(stringValue);
  }

  return value;
}

function companyIdQuery(companyId) {
  if (!companyId) return null;

  const stringValue = companyId.toString();
  const values = [stringValue];

  if (mongoose.Types.ObjectId.isValid(stringValue)) {
    values.push(new mongoose.Types.ObjectId(stringValue));
  }

  return { $in: values };
}
const mapTransaction = (doc) => {
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),

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

    companyId: doc.companyId?.toString?.() || doc.companyId,
    createdByUserId: doc.createdByUserId?.toString?.() || doc.createdByUserId,

    isCompleted: doc.isCompleted ?? false,
    isOpened: doc.isOpened ?? false,
    lastSyncedAt: doc.lastSyncedAt ?? null,

    templateFieldValues: doc.templateFieldValues || {},
    evalData: doc.evalData || {},

    priority: doc.priority || "normal",
    attachmentsCount: doc.attachmentsCount || 0,
    imagesCount: doc.imagesCount || 0,

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

    const query = Transaction.findById(toObjectId(id));

    if (options.session) query.session(options.session);

    const transaction = await query.lean();

    return mapTransaction(transaction);
  },

 async findByIdAndCompanyId({ transactionId, companyId }, options = {}) {
  if (!transactionId || !companyId) return null;

  const query = Transaction.findOne({
    _id: toObjectId(transactionId),
    $expr: {
      $eq: [
        { $toString: "$companyId" },
        companyId.toString(),
      ],
    },
  });

  if (options.session) query.session(options.session);

  const transaction = await query.lean();

  return mapTransaction(transaction);
},

async findByCompanyIdPaginated(
  { companyId, page = 1, limit = 10 },
  options = {}
) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const companyIdString = companyId.toString();

  const query = {
    $expr: {
      $eq: [
        { $toString: "$companyId" },
        companyIdString,
      ],
    },
  };


  const transactionsQuery = Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit);

  const countQuery = Transaction.countDocuments(query);

  if (options.session) {
    transactionsQuery.session(options.session);
    countQuery.session(options.session);
  }

  const [transactions, total] = await Promise.all([
    transactionsQuery.lean(),
    countQuery,
  ]);



  return {
    transactions: transactions.map(mapTransaction),
    total,
  };
},

async searchByAssignmentNumberAndCompanyId(
  { companyId, assignmentNumber, page = 1, limit = 10 },
  options = {}
) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const skip = (safePage - 1) * safeLimit;

  const companyIdString = companyId.toString();
  const searchText = String(assignmentNumber || "").trim();

  const query = {
    $and: [
      {
        $expr: {
          $eq: [{ $toString: "$companyId" }, companyIdString],
        },
      },
      {
        assignmentNumber: {
          $regex: searchText,
          $options: "i",
        },
      },
    ],
  };

  const transactionsQuery = Transaction.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(safeLimit);

  const countQuery = Transaction.countDocuments(query);

  if (options.session) {
    transactionsQuery.session(options.session);
    countQuery.session(options.session);
  }

  const [transactions, total] = await Promise.all([
    transactionsQuery.lean(),
    countQuery,
  ]);

  return {
    transactions: transactions.map(mapTransaction),
    total,
  };
},

  async markAsOpened(id, options = {}) {
    if (!id) return null;

    const query = Transaction.findByIdAndUpdate(
      toObjectId(id),
      {
        $set: {
          isOpened: true,
        },
      },
      { new: true }
    );

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

    if (payload.evalData !== undefined) {
      update.evalData = payload.evalData;
    }

    if (payload.templateFieldValues !== undefined) {
      update.templateFieldValues = payload.templateFieldValues;
    }

    if (payload.inspectionNotes !== undefined) {
  update["evalData.inspectionNotes"] = payload.inspectionNotes;
}

    update.isCompleted = payload.isCompleted ?? true;
    update.lastSyncedAt = payload.lastSyncedAt ?? new Date();

    const query = Transaction.findByIdAndUpdate(
      toObjectId(id),
      { $set: update },
      { new: true }
    );

    if (options.session) query.session(options.session);

    const transaction = await query.lean();

    return mapTransaction(transaction);
  },

  async incrementImagesCount(id, count, options = {}) {
    const query = Transaction.findByIdAndUpdate(
      toObjectId(id),
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

  async incrementAttachmentsCount(id, count, options = {}) {
    const query = Transaction.findByIdAndUpdate(
      toObjectId(id),
      {
        $inc: {
          attachmentsCount: count,
        },
      },
      { new: true }
    );

    if (options.session) query.session(options.session);

    const transaction = await query.lean();

    return mapTransaction(transaction);
  },
};