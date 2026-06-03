// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      default: null,
    },

    usernameLower: {
      type: String,
      lowercase: true,
      index: true,
      sparse: true,
    },

    // NEW
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      
    },

    role: {
      type: String,
      required: true,
      default: "Freelance Inspector",
      enum: ["Manager", "Inspector", "Valuator", "company_admin" , "Freelance Inspector"],
    },

    name: {
  type: String,
  trim: true,
  default: null,
},

serviceCities: {
  type: [String],
  default: [],
  index: true,
},

isProfileCompleted: {
  type: Boolean,
  default: false,
},

    passwordHash: {
      type: String,
      required: true,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    blockedAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (this.username) {
    this.usernameLower = this.username.toLowerCase();
  }

  next();
});

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);