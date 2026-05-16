// transaction.controller.js
import { transactionService } from "../../application/transactions/transaction.service.js";

export const transactionController = {
  async listTransactions(req, res) {
    try {
      const transactions = await transactionService.listTransactions();

      return res.status(200).json({
        success: true,
        data: transactions,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async updateInspectionData(req, res) {
    try {
      const { transactionId } = req.params;

      const transaction = await transactionService.updateInspectionData(
        transactionId,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: "Inspection data updated successfully",
        data: transaction,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getTransactionDetails(req, res) {
    try {
      const { transactionId } = req.params;

      const transaction = await transactionService.getTransactionDetails(
        transactionId
      );

      return res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};