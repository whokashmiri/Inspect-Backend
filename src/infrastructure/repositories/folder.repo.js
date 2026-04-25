import mongoose from "mongoose";
import { Folder } from "../../models/Folder.js";

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

const mapCreatedBy = (user) => {
  if (!user) return null;
  return {
    id: toId(user._id ?? user),
    fullName: user.fullName ?? null,
    email: user.email ?? null,
  };
};

const mapFolder = (doc, { includeCreatedBy = false } = {}) => {
  if (!doc) return null;
  const folder = {
    id: toId(doc._id),
    name: doc.name,
    projectId: toId(doc.projectId),
    parentId: toId(doc.parent),
    createdAt: doc.createdAt,
    createdById: toId(doc.createdBy),
  };
  if (includeCreatedBy) {
    folder.createdBy = mapCreatedBy(doc.createdBy);
  }
  return folder;
};

export const folderRepository = {
  async create({ name, projectId, parentId, createdById }) {
    const folder = new Folder({
      name,
      projectId,
      parent: parentId || null,
      createdBy: createdById,
    });
    await folder.save();
    await folder.populate("createdBy", "fullName email");
    return mapFolder(folder.toObject(), { includeCreatedBy: true });
  },

  async findById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
    const folder = await Folder.findById(id).lean();
    return mapFolder(folder);
  },



async findByProjectIdAndParentId(projectId, parentId = null) {
  const query = Folder.find({
    projectId: new mongoose.Types.ObjectId(projectId),
    parent: parentId ? new mongoose.Types.ObjectId(parentId) : null,
  })
    .sort({ createdAt: -1 })
    .populate("createdBy", "fullName email");
      // console.log(projectId, parentId);


  const folders = await query.lean();
  // console.log(folders);
  
  return folders.map((doc) => mapFolder(doc, { includeCreatedBy: true }));
}
};