//models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    usernameLower: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    role: {
      type: String,
      required: true,
      enum: ["Manager", "Inspector", "Valuator", "company_admin"], // added your new role
    },

    passwordHash: { type: String, required: true },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    // 🔒 optional but important for login control
    isBlocked: { type: Boolean, default: false },
    blockedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true, // gives createdAt + updatedAt
  }
);

// 🔥 ensure usernameLower is always set
userSchema.pre("save", function (next) {
  if (this.username) {
    this.usernameLower = this.username.toLowerCase();
  }
  next();
});

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);