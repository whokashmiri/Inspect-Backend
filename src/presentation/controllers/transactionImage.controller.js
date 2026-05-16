// transactionImage.controller.js
import { transactionMediaService } from "../../application/transactions/transactionImages.service.js";

export const transactionMediaController = {
  async addMedia(req, res) {
    try {
      const { transactionId } = req.params;

      const media = await transactionMediaService.addMedia(
        transactionId,
        req.body.media
      );

      return res.status(201).json({
        success: true,
        message: "Media saved successfully",
        data: media,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getMedia(req, res) {
    try {
      const { transactionId } = req.params;

      const media = await transactionMediaService.getMedia(transactionId);

      return res.status(200).json({
        success: true,
        data: media,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  async deleteMedia(req, res) {
    try {
      const { mediaId } = req.params;

      const deletedMedia = await transactionMediaService.deleteMedia(mediaId);

      return res.status(200).json({
        success: true,
        message: "Media deleted successfully",
        data: deletedMedia,
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },
};