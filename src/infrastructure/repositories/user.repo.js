import mongoose from "mongoose";
import { RefreshToken } from "../../models/RefreshToken.js";
import { User } from "../../models/User.js";

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
    email: doc.email,
    fullName: doc.fullName,
    role: doc.role,
    createdAt: doc.createdAt,
    company: mapCompany(doc.company),
  };
  if (includePasswordHash) {
    user.passwordHash = doc.passwordHash;
  }
  return user;
};

export const userRepository = {
  async findByEmail(email) {
    const query = User.findOne({ email });
    const user = await query.populate("company", "name").lean();
    return mapUser(user, { includePasswordHash: true });
  },

  async findById(id) {
    if (!id) return null;
    const query = User.findById(id);
    const user = await query.populate("company", "name").lean();
    return mapUser(user);
  },

  async findManagerByCompanyId(companyId, options = {}) {
    if (!companyId) return null;
    const query = User.findOne({ company: companyId, role: "Manager" });
    if (options.session) query.session(options.session);
    const manager = await query.lean();
    return mapUser(manager);
  },

  async create({ email, fullName, role, passwordHash, companyId }, options = {}) {
    const user = new User({
      email,
      fullName,
      role,
      passwordHash,
      company: companyId,
    });
    await user.save({ session: options.session });
    await user.populate("company", "name");
    return mapUser(user.toObject());
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
