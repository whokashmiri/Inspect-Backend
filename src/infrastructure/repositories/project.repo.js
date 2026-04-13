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
  return { id: toId(company._id ?? company), name: company.name ?? null };
};

const mapCreatedBy = (user) => {
  if (!user) return null;
  return {
    id: toId(user._id ?? user),
    fullName: user.fullName ?? null,
    email: user.email ?? null,
  };
};

const mapProject = (doc) => {
  if (!doc) return null;
  return {
    id: toId(doc._id),
    name: doc.name,
    status: doc.status,
    isFavorite: doc.isFavorite,
    createdAt: doc.createdAt,
    companyId: toId(doc.company),
    createdById: toId(doc.createdBy),
    company: mapCompany(doc.company),
    createdBy: mapCreatedBy(doc.createdBy),
  };
};

const populateProjectQuery = (query) =>
  query.populate("company", "name").populate("createdBy", "fullName email");

export const projectRepository = {
  async create({ name, companyId, createdById }) {
    const project = new Project({
      name,
      company: companyId,
      createdBy: createdById,
    });
    await project.save();
    await project.populate("company", "name");
    await project.populate("createdBy", "fullName email");
    return mapProject(project.toObject());
  },

  async findByCompanyId(companyId) {
    const query = Project.find({ company: companyId })
      .sort({ createdAt: -1 });
    const projects = await populateProjectQuery(query).lean();
    return projects.map(mapProject);
  },

  async findByCompanyIdAndCreatedById(companyId, createdById) {
    const query = Project.find({
      company: companyId,
      createdBy: createdById,
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
