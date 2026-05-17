// transactionImages.repo.js

import { TransactionMedia } from "../../models/transactionImage.js";

const mapTransactionMedia = (doc) => {
  if (!doc) return null;

  return {
    id: doc._id.toString(),
    _id: doc._id.toString(),

    transactionId: doc.transactionId?.toString(),

    mediaType: doc.mediaType,

    name: doc.name,
    originalName: doc.originalName,

    url: doc.url,
    publicId: doc.publicId,

    mimeType: doc.mimeType,
    size: doc.size,

    duration: doc.duration,
    width: doc.width,
    height: doc.height,

    thumbnailUrl: doc.thumbnailUrl,

    sortIndex: doc.sortIndex,

    uploadedAt: doc.uploadedAt,
    updatedAt: doc.updatedAt,
  };
};

export const transactionMediaRepository = {
  async createMany(mediaList, options = {}) {
    const media = await TransactionMedia.insertMany(mediaList, {
      session: options.session,
    });

    return media.map((item) => mapTransactionMedia(item.toObject()));
  },

  async findByTransactionId(transactionId, options = {}) {
    const query = TransactionMedia.find({ transactionId }).sort({
      sortIndex: 1,
      uploadedAt: 1,
    });

    if (options.session) query.session(options.session);

    const media = await query.lean();

    return media.map(mapTransactionMedia);
  },

  async findByTransactionIds(transactionIds, options = {}) {
    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return [];
    }

    const query = TransactionMedia.find({
      transactionId: { $in: transactionIds },
    }).sort({
      transactionId: 1,
      sortIndex: 1,
      uploadedAt: 1,
    });

    if (options.session) query.session(options.session);

    const media = await query.lean();

    return media.map(mapTransactionMedia);
  },

  async deleteById(id, options = {}) {
    const query = TransactionMedia.findByIdAndDelete(id);

    if (options.session) query.session(options.session);

    const deleted = await query.lean();

    return mapTransactionMedia(deleted);
  },
};