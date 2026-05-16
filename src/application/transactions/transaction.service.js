// transaction.service.js
import { transactionRepository } from "../../infrastructure/repositories/transaction.repo.js";
import { transactionMediaRepository } from "../../infrastructure/repositories/transactionImage.repo.js";

export const transactionService = {
  async listTransactions() {
    return transactionRepository.findAll();
  },

  async getTransactionDetails(transactionId) {
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    const media = await transactionMediaRepository.findByTransactionId(
      transactionId
    );

    return {
      ...transaction,
      media,
    };
  },

  async updateInspectionData(transactionId, payload) {
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return transactionRepository.updateInspectionData(transactionId, payload);
  },
};