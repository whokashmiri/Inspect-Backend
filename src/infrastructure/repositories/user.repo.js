import mongoose from "mongoose";
import { RefreshToken } from "../../models/RefreshToken.js";
import { User } from "../../models/User.js";
import { Company } from "../../models/Company.js";


const toId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value && value._id) {
    return value._id.toString();
  }
  if (typeof value.toString === "function") {
    return value.toString();
  }
  return null;
};

const mapCompany = (company) => {
  if (!company) return null;
  const id = toId(company._id ?? company);
  return {
    id,
    name: company.name ?? null,
  };
};

const mapUser = (doc, { includePasswordHash = false } = {}) => {
  if (!doc) return null;

  const user = {
    id: toId(doc._id),
    username: doc.username,
    usernameLower: doc.usernameLower,
    role: doc.role,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt ?? null,
    lastLoginAt: doc.lastLoginAt ?? null,
    isBlocked: doc.isBlocked ?? false,
    blockedAt: doc.blockedAt ?? null,
    company: mapCompany(doc.company),
  };

  if (includePasswordHash) {
    user.passwordHash = doc.passwordHash;
  }

  return user;
};

export const userRepository = {
  async findByUsername(usernameLower) {
    const query = User.findOne({ usernameLower });
    const user = await query.populate("company", "name").lean();
    return mapUser(user, { includePasswordHash: true });
  },

  async findById(id) {
    if (!id) return null;
    const query = User.findById(id);
    const user = await query.populate("company", "name").lean();
    return mapUser(user);
  },

  async updateLastLogin(id) {
    if (!id) return null;

    const user = await User.findByIdAndUpdate(
      id,
      { lastLoginAt: new Date() },
      { new: true }
    )
      .populate("company", "name")
      .lean();

    return mapUser(user);
  },

  async saveRefreshToken(userId, token, expiresAt) {
    await RefreshToken.create({
      user: new mongoose.Types.ObjectId(userId),
      token,
      expiresAt,
    });
  },

  async findRefreshToken(token) {
    const doc = await RefreshToken.findOne({ token }).lean();
    if (!doc) return null;

    return {
      id: toId(doc._id),
      token: doc.token,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      userId: toId(doc.user),
    };
  },

  async deleteRefreshToken(token) {
    await RefreshToken.deleteOne({ token });
  },

  async deleteAllRefreshTokens(userId) {
    if (!userId) return;
    await RefreshToken.deleteMany({ user: new mongoose.Types.ObjectId(userId) });
  },
};