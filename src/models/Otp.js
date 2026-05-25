// models/Otp.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["signup", "login", "reset-password"],
      default: "signup",
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    resendCount: {
      type: Number,
      default: 0,
    },

    lastSentAt: {
      type: Date,
      default: Date.now,
    },

    provider: {
      type: String,
      enum: ["taqnyat"],
      default: "taqnyat",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Only one active OTP per phone + purpose
otpSchema.index({ phone: 1, purpose: 1 }, { unique: true });

export const Otp =
  mongoose.models.Otp || mongoose.model("Otp", otpSchema);