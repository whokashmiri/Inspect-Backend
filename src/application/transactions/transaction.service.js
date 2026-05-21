// transaction.service.js
import { transactionRepository } from "../../infrastructure/repositories/transaction.repo.js";
import { transactionMediaRepository } from "../../infrastructure/repositories/transactionImage.repo.js";
import { User } from "../../models/User.js";

import mongoose from "mongoose";

async function getCompanyIdFromUser(userOrUserId) {
  if (!userOrUserId) return null;

  const directCompany =
    userOrUserId?.company?.id ||
    userOrUserId?.company?._id ||
    userOrUserId?.companyId ||
    userOrUserId?.company;

  if (directCompany) {
    return directCompany.toString();
  }

  const userId =
    userOrUserId?.id ||
    userOrUserId?._id ||
    userOrUserId?.userId ||
    userOrUserId;

  if (!userId) return null;

  const user = await User.findById(userId)
    .select("_id username company")
    .lean();

 

  return user?.company?.toString() || null;
}

function buildCompanyIdQueryValues(companyId) {
  const values = [];

  if (!companyId) return values;

  values.push(companyId.toString());

  if (mongoose.Types.ObjectId.isValid(companyId)) {
    values.push(new mongoose.Types.ObjectId(companyId));
  }

  return values;
}
function normalizeTransactionId(transaction) {
  return String(transaction?._id || transaction?.id || "");
}

export const transactionService = {
  async listTransactions() {
    return transactionRepository.findAll();
  },

  async listCompanyTransactions(user, { page = 1, limit = 10 } = {}) {
    const companyId = await getCompanyIdFromUser(user);

    if (!companyId) {
      throw new Error("User is not linked to a company");
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const result = await transactionRepository.findByCompanyIdPaginated({
      companyId,
      page: safePage,
      limit: safeLimit,
    });

    return {
      companyId,
      page: safePage,
      limit: safeLimit,
      total: result.total,
      hasMore: safePage * safeLimit < result.total,
      transactions: result.transactions,
    };
  },

  async downloadCompanyTransactions(user, { page = 1, limit = 10 } = {}) {
    const companyId = await getCompanyIdFromUser(user);

    if (!companyId) {
      throw new Error("User is not linked to a company");
    }

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const result = await transactionRepository.findByCompanyIdPaginated({
      companyId,
      page: safePage,
      limit: safeLimit,
    });

    const transactionIds = result.transactions
      .map(normalizeTransactionId)
      .filter(Boolean);

    const media = await transactionMediaRepository.findByTransactionIds(
      transactionIds
    );

    const mediaByTransactionId = media.reduce((acc, item) => {
      const key = String(item.transactionId);

      if (!acc[key]) acc[key] = [];
      acc[key].push(item);

      return acc;
    }, {});

    return {
      companyId,
      page: safePage,
      limit: safeLimit,
      total: result.total,
      hasMore: safePage * safeLimit < result.total,
      transactions: result.transactions.map((transaction) => {
        const id = normalizeTransactionId(transaction);

        return {
          ...transaction,
          media: mediaByTransactionId[id] || [],
        };
      }),
    };
  },

  async getTransactionDetails(user, transactionId) {
    const companyId = await getCompanyIdFromUser(user);

    if (!companyId) {
      throw new Error("User is not linked to a company");
    }

    const transaction = await transactionRepository.findByIdAndCompanyId({
      transactionId,
      companyId,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    await transactionRepository.markAsOpened(transactionId);

    const media = await transactionMediaRepository.findByTransactionId(
      transactionId
    );

    return {
      ...transaction,
      isOpened: true,
      media,
    };
  },

  async markTransactionOpened(user, transactionId) {
    const companyId = await getCompanyIdFromUser(user);

    if (!companyId) {
      throw new Error("User is not linked to a company");
    }

    const transaction = await transactionRepository.findByIdAndCompanyId({
      transactionId,
      companyId,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return transactionRepository.markAsOpened(transactionId);
  },

  async updateInspectionData(user, transactionId, payload) {
    const companyId = await getCompanyIdFromUser(user);

    if (!companyId) {
      throw new Error("User is not linked to a company");
    }

    const transaction = await transactionRepository.findByIdAndCompanyId({
      transactionId,
      companyId,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return transactionRepository.updateInspectionData(transactionId, {
      ...payload,
      isCompleted: true,
      lastSyncedAt: new Date(),
    });
  },

 async searchCompanyTransactionsByAssignmentNumber(
  user,
  { assignmentNumber = "", page = 1, limit = 10 } = {}
) {
  const companyId = await getCompanyIdFromUser(user);

  if (!companyId) {
    throw new Error("User is not linked to a company");
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const searchText = String(assignmentNumber || "").trim();

  if (!searchText) {
    return {
      companyId,
      page: safePage,
      limit: safeLimit,
      total: 0,
      hasMore: false,
      transactions: [],
    };
  }

  const result =
    await transactionRepository.searchByAssignmentNumberAndCompanyId({
      companyId,
      assignmentNumber: searchText,
      page: safePage,
      limit: safeLimit,
    });

  return {
    companyId,
    page: safePage,
    limit: safeLimit,
    total: result.total,
    hasMore: safePage * safeLimit < result.total,
    transactions: result.transactions,
  };
},
};