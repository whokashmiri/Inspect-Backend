
//transactionImages.service.js

import { transactionRepository } from "../../infrastructure/repositories/transaction.repo.js";
import { transactionMediaRepository } from "../../infrastructure/repositories/transactionImage.repo.js";

export const transactionMediaService = {
  async addMedia(transactionId, mediaList) {
    const transaction = await transactionRepository.findById(transactionId);

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (!Array.isArray(mediaList) || mediaList.length === 0) {
      throw new Error("Media list is required");
    }

    const preparedMedia = mediaList.map((item, index) => {
      if (!["image", "video"].includes(item.mediaType)) {
        throw new Error("mediaType must be image or video");
      }

      if (!item.url) {
        throw new Error("Media url is required");
      }

      if (!item.publicId) {
        throw new Error("Cloudinary publicId is required");
      }

      return {
        transactionId,
        mediaType: item.mediaType,

        name: item.name || item.originalName || `Media ${index + 1}`,
        originalName: item.originalName || "",

        url: item.url,
        publicId: item.publicId,

        mimeType: item.mimeType || "",
        size: item.size || 0,

        duration: item.duration || null,
        width: item.width || null,
        height: item.height || null,

        thumbnailUrl: item.thumbnailUrl || "",

        sortIndex: item.sortIndex ?? index,
      };
    });

    const createdMedia = await transactionMediaRepository.createMany(
      preparedMedia
    );

    const imageCount = createdMedia.filter(
      (item) => item.mediaType === "image"
    ).length;

    if (imageCount > 0) {
      await transactionRepository.incrementImagesCount(transactionId, imageCount);
    }

    return createdMedia;
  },

  async getMedia(transactionId) {
    return transactionMediaRepository.findByTransactionId(transactionId);
  },

  async deleteMedia(mediaId) {
    return transactionMediaRepository.deleteById(mediaId);
  },
};