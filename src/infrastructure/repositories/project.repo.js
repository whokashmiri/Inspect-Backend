
// src/infrastructure/repositories/project.repo.js

import mongoose from "mongoose";
import { Project } from "../../models/Project.js";
import { Asset } from "../../models/Asset.js"; // adjust path/name if your model file differs

const mapInspectorFile = (file) => {
  if (!file) return null;

  return {
    id: file.id,
    name: file.name,
    type: file.type,
    url: file.url,
    uploadedBy: toId(file.uploadedBy),
    createdAt: file.createdAt,
    storage: file.storage,
    spacesKey: file.spacesKey,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
  };
};

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

const emptyStats = {
  totalAssets: 0,
  doneAssets: 0,
  incompleteAssets: 0,
  assetsWithNotes: 0,
  assetsWithoutNotes: 0,
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

const mapProject = (doc, stats = emptyStats) => {
  if (!doc) return null;

  return {
    id: toId(doc._id),
    name: doc.name,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt ?? null,
    workflowStatus: doc.workflowStatus,
    reportType: doc.reportType ?? "simple",
    reportData: doc.reportData ?? {},

    locations: doc.locations || [],
    contacts: doc.contacts || [],

    inspectorFiles: (doc.inspectorFiles || []).map(mapInspectorFile),
    companyId: toId(doc.companyId),
    userId: toId(doc.userId),
    company: mapCompany(doc.companyId),
    user: mapUser(doc.userId),
    stats,
  };
};
const populateProjectQuery = (query) =>
  query.populate("companyId", "name").populate("userId", "username role");

async function getStatsMap(projectIds) {
  if (!projectIds.length) return {};

  const objectIds = projectIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const result = await Asset.aggregate([
    {
      $match: {
        projectId: { $in: objectIds },
        isAssetFolder: true,
      },
    },
    {
      $group: {
        _id: "$projectId",
        totalAssets: { $sum: 1 },
        doneAssets: {
          $sum: {
            $cond: [{ $eq: ["$isDone", true] }, 1, 0],
          },
        },
        incompleteAssets: {
          $sum: {
            $cond: [{ $eq: ["$isDone", true] }, 0, 1],
          },
        },
         assetsWithNotes: {
  $sum: {
    $cond: [
      {
        $and: [
          { $eq: ["$hasNotes", true] },
          { $ne: ["$notes", null] },
          { $ne: ["$notes", ""] },
        ],
      },
      1,
      0,
    ],
  },
},

      assetsWithoutNotes: {
        $sum: {
          $cond: [{ $eq: ["$hasNotes", true] }, 0, 1],
        },
      },
      },
    },
  ]);

  return result.reduce((acc, item) => {
    acc[item._id.toString()] = {
      totalAssets: item.totalAssets,
      doneAssets: item.doneAssets,
      incompleteAssets: item.incompleteAssets,
      assetsWithNotes: item.assetsWithNotes,
       assetsWithoutNotes: item.assetsWithoutNotes,
    };

    return acc;
  }, {});
}

export const projectRepository = {


async findRawById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  return Project.findById(id).lean();
},

async findInspectorFilesByProjectId(projectId) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) return null;

  const project = await Project.findById(projectId)
    .select("inspectorFiles companyId userId name")
    .lean();

  if (!project) return null;

  return {
    projectId: project._id.toString(),
    companyId: toId(project.companyId),
    userId: toId(project.userId),
    projectName: project.name,
    inspectorFiles: (project.inspectorFiles || []).map(mapInspectorFile),
  };
},

async findInspectorFileById(projectId, fileId) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) return null;

  const project = await Project.findById(projectId)
    .select("inspectorFiles companyId userId name")
    .lean();

  if (!project) return null;

  const file = (project.inspectorFiles || []).find(
    (item) => String(item.id) === String(fileId)
  );

  if (!file) return null;

  return {
    projectId: project._id.toString(),
    companyId: toId(project.companyId),
    userId: toId(project.userId),
    projectName: project.name,
    file: mapInspectorFile(file),
  };
},


 async create({
  name,
  companyId,
  userId,
  workflowStatus = "new",
  reportType = "simple",
  reportData = {},
   locations = [],
  contacts = [],
  inspectorFiles = [],
}) {
  const project = new Project({
    name,
    companyId,
    userId,
    workflowStatus,
    reportType,
    reportData,
     locations,
    contacts,
    inspectorFiles,
  });

  await project.save();
  await project.populate("companyId", "name");
  await project.populate("userId", "username role");

  return mapProject(project.toObject(), emptyStats);
},

  async findByCompanyId(companyId) {
    const query = Project.find({ companyId }).sort({ createdAt: -1 });
    const projects = await populateProjectQuery(query).lean();

    const ids = projects.map((project) => project._id.toString());
    const statsMap = await getStatsMap(ids);

    return projects.map((project) =>
      mapProject(project, statsMap[project._id.toString()] ?? emptyStats)
    );
  },

  async findByCompanyIdAndUserId(companyId, userId) {
    const query = Project.find({ companyId, userId }).sort({ createdAt: -1 });
    const projects = await populateProjectQuery(query).lean();

    const ids = projects.map((project) => project._id.toString());
    const statsMap = await getStatsMap(ids);

    return projects.map((project) =>
      mapProject(project, statsMap[project._id.toString()] ?? emptyStats)
    );
  },

  async findById(id) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

    const project = await populateProjectQuery(Project.findById(id)).lean();
    if (!project) return null;

    const statsMap = await getStatsMap([project._id.toString()]);

    return mapProject(project, statsMap[project._id.toString()] ?? emptyStats);
  },

  async getStatsByProjectId(projectId) {
    if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
      return emptyStats;
    }

    const statsMap = await getStatsMap([projectId]);
    return statsMap[projectId] ?? emptyStats;
  },
};