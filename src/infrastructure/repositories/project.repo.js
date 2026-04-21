import mongoose from "mongoose";
import { Project } from "../../models/Project.js";

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
  return {
    id: toId(company._id ?? company),
    name: company.name ?? null,
  };
};

const mapUser = (user) => {
  if (!user) return null;
  return {
    id: toId(user._id ?? user),
    username: user.username ?? null,
    role: user.role ?? null,
  };
};

const mapProject = (doc) => {
  if (!doc) return null;

  return {
    id: toId(doc._id),
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt ?? null,
    workflowStatus: doc.workflowStatus,
    companyId: toId(doc.companyId),
    userId: toId(doc.userId),
    company: mapCompany(doc.companyId),
    user: mapUser(doc.userId),
  };
};

const populateProjectQuery = (query) =>
  query
    .populate("companyId", "name")
    .populate("userId", "username role");

export const projectRepository = {
  async create({ name, companyId, userId, workflowStatus = "new" }) {
    const project = new Project({
      name,
      companyId,
      userId,
      workflowStatus,
    });

    await project.save();
    await project.populate("companyId", "name");
    await project.populate("userId", "username role");

    return mapProject(project.toObject());
  },

  async findByCompanyId(companyId) {
    const query = Project.find({ companyId }).sort({ createdAt: -1 });
    const projects = await populateProjectQuery(query).lean();
    return projects.map(mapProject);
  },

  async findByCompanyIdAndUserId(companyId, userId) {
    const query = Project.find({
      companyId,
      userId,
    }).sort({ createdAt: -1 });

    const projects = await populateProjectQuery(query).lean();
    return projects.map(mapProject);
  },

  async findById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
    const project = await populateProjectQuery(Project.findById(id)).lean();
    return mapProject(project);
  },
};