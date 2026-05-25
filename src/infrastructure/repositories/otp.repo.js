import { Otp } from "../../models/Otp.js";

const toId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value && value._id) {
    return value._id.toString();
  }
  if (typeof value.toString === "function") return value.toString();
  return null;
};

const mapOtp = (doc) => {
  if (!doc) return null;

  return {
    id: toId(doc._id),
    phone: doc.phone,
    otpHash: doc.otpHash,
    purpose: doc.purpose,
    expiresAt: doc.expiresAt,
    attempts: doc.attempts ?? 0,
    resendCount: doc.resendCount ?? 0,
    lastSentAt: doc.lastSentAt ?? null,
    provider: doc.provider,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const otpRepository = {
  async create(data) {
    const doc = await Otp.create(data);
    return mapOtp(doc);
  },

  async findByPhoneAndPurpose(phone, purpose) {
    const doc = await Otp.findOne({ phone, purpose }).lean();
    return mapOtp(doc);
  },

  async deleteByPhoneAndPurpose(phone, purpose) {
    await Otp.deleteOne({ phone, purpose });
  },

  async incrementAttempts(id) {
    const doc = await Otp.findByIdAndUpdate(
      id,
      { $inc: { attempts: 1 } },
      { new: true }
    ).lean();

    return mapOtp(doc);
  },
};