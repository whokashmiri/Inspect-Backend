// transaction.service.js
import { transactionRepository } from "../../infrastructure/repositories/transaction.repo.js";
import { transactionMediaRepository } from "../../infrastructure/repositories/transactionImage.repo.js";
import { User } from "../../models/User.js";

function normalizeTransactionId(transaction) {
  return String(transaction?._id || transaction?.id || "");
}

function getUserId(userOrUserId) {
  return String(
    userOrUserId?.id ||
      userOrUserId?._id ||
      userOrUserId?.userId ||
      userOrUserId ||
      ""
  );
}

async function getCompanyIdFromUser(userOrUserId) {
  if (!userOrUserId) return null;

  const directCompany =
    userOrUserId?.company?.id ||
    userOrUserId?.company?._id ||
    userOrUserId?.companyId ||
    userOrUserId?.company;

  if (directCompany) return directCompany.toString();

  const userId = getUserId(userOrUserId);
  if (!userId) return null;

  const user = await User.findById(userId).select("_id username company").lean();

  return user?.company?.toString() || null;
}

export const transactionService = {
  async listTransactions() {
    return transactionRepository.findAll();
  },

  async listCompanyTransactions(user, { page = 1, limit = 10 } = {}) {
    const companyId = await getCompanyIdFromUser(user);
    const userId = getUserId(user);

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const result = await transactionRepository.findAccessiblePaginated({
      companyId,
      userId,
      page: safePage,
      limit: safeLimit,
    });

    return {
      companyId,
      userId,
      page: safePage,
      limit: safeLimit,
      total: result.total,
      hasMore: safePage * safeLimit < result.total,
      transactions: result.transactions,
    };
  },

  async downloadCompanyTransactions(user, { page = 1, limit = 10 } = {}) {
    const companyId = await getCompanyIdFromUser(user);
    const userId = getUserId(user);

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

    const result = await transactionRepository.findAccessiblePaginated({
      companyId,
      userId,
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
      userId,
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
    const userId = getUserId(user);

    const transaction = await transactionRepository.findAccessibleById({
      transactionId,
      companyId,
      userId,
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
    const userId = getUserId(user);

    const transaction = await transactionRepository.findAccessibleById({
      transactionId,
      companyId,
      userId,
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return transactionRepository.markAsOpened(transactionId);
  },

  async updateInspectionData(user, transactionId, payload) {
    const companyId = await getCompanyIdFromUser(user);
    const userId = getUserId(user);

    const transaction = await transactionRepository.findAccessibleById({
      transactionId,
      companyId,
      userId,
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
    const userId = getUserId(user);

    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const searchText = String(assignmentNumber || "").trim();

    if (!searchText) {
      return {
        companyId,
        userId,
        page: safePage,
        limit: safeLimit,
        total: 0,
        hasMore: false,
        transactions: [],
      };
    }

    const result = await transactionRepository.searchAccessibleByAssignmentNumber({
      companyId,
      userId,
      assignmentNumber: searchText,
      page: safePage,
      limit: safeLimit,
    });

    return {
      companyId,
      userId,
      page: safePage,
      limit: safeLimit,
      total: result.total,
      hasMore: safePage * safeLimit < result.total,
      transactions: result.transactions,
    };
  },
};