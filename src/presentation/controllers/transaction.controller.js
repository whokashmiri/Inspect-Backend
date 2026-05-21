// transaction.controller.js

import { transactionService } from "../../application/transactions/transaction.service.js";

function getAuthUser(req) {
  return req.user || req.userId || req.user?.id;
}

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

  async listCompanyTransactions(req, res) {
    try {
      const result = await transactionService.listCompanyTransactions(
        getAuthUser(req),
        {
          page: req.query.page,
          limit: req.query.limit,
        }
      );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async downloadCompanyTransactions(req, res) {
    try {
      const result = await transactionService.downloadCompanyTransactions(
        getAuthUser(req),
        {
          page: req.query.page,
          limit: req.query.limit,
        }
      );

      return res.status(200).json({
        success: true,
        ...result,
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
        getAuthUser(req),
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
        getAuthUser(req),
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

  async markTransactionOpened(req, res) {
    try {
      const { transactionId } = req.params;

      const transaction = await transactionService.markTransactionOpened(
        getAuthUser(req),
        transactionId
      );

      return res.status(200).json({
        success: true,
        message: "Transaction marked as opened",
        data: transaction,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async searchCompanyTransactions(req, res) {
  try {
    const result = await transactionService.searchCompanyTransactionsByAssignmentNumber(
      getAuthUser(req),
      {
        assignmentNumber: req.query.assignmentNumber,
        page: req.query.page,
        limit: req.query.limit,
      }
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
},
};