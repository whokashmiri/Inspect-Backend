
//transaction.service.js
import { transactionRepository } from "../../infrastructure/repositories/transaction.repo.js";

export const transactionService = {
      async listTransactions() {
    return transactionRepository.findAll();
  },

  async updateInspectionData(transactionId, payload) {
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    return transactionRepository.updateInspectionData(transactionId, payload);
  },
};