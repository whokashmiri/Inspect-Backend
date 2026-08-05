
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

    storage:
      file.storage ||
      (file.publicId ? "cloudinary" : "digitalocean"),

    spacesKey: file.spacesKey ?? null,
    publicId: file.publicId ?? null,

    mimeType: file.mimeType ?? "",
    sizeBytes: Number(file.sizeBytes || 0),
    duration:
      typeof file.duration === "number"
        ? file.duration
        : null,
    thumbnailUrl: file.thumbnailUrl ?? null,

    locationIds: file.locationIds || [],
  };
};


const mapInspectionAssignment = (assignment) => {
  if (!assignment) return null;

  return {
    id: assignment.id,
    inspectorUserId: toId(assignment.inspectorUserId),
    inspectorName: assignment.inspectorName ?? "",
    locationIds: assignment.locationIds || [],
    assignedBy: toId(assignment.assignedBy),
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
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
  presentAssets: 0,
  notPresentAssets: 0,
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
    name: user.name ?? null,
    phone: user.phone ?? null,
    serviceCities: user.serviceCities ?? [],
    isProfileCompleted: user.isProfileCompleted ?? false,
    isPhoneVerified: user.isPhoneVerified ?? false,
  };
};
const mapProject = (doc, stats = emptyStats) => {
  if (!doc) return null;

  const inspectorFiles = (doc.inspectorFiles || []).map(mapInspectorFile);

  const locations = (doc.locations || []).map((location) => {
    const locationId = String(location.id);

    return {
      ...location,
      notes: location.notes || "",
      inspectorFiles: inspectorFiles.filter((file) =>
        (file.locationIds || []).map(String).includes(locationId)
      ),
    };
  });

  return {
    id: toId(doc._id),
    name: doc.name,

    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt ?? null,

    // IMPORTANT FOR OFFLINE AUTO-SYNC
    syncVersion: Number(doc.syncVersion || 1),
    lastSyncedChangeAt:
      doc.lastSyncedChangeAt || doc.updatedAt || doc.createdAt || null,

    workflowStatus: doc.workflowStatus,
    reportType: doc.reportType ?? "simple",
    reportData: doc.reportData ?? {},
    isFavorite: doc.isFavorite ?? false,

inspectionLocation:
  doc.inspectionLocation ||
  doc.reportData?.inspectionLocation ||
  "",

inspectionMapUrl:
  doc.inspectionMapUrl ||
  doc.reportData?.inspectionMapUrl ||
  "",

inspectionDate:
  doc.inspectionDate ??
  doc.reportData?.inspectionDate ??
  null,

    locations,

    inspectorFiles,

    inspectionAssignments: (doc.inspectionAssignments || []).map(
      mapInspectionAssignment
    ),

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

           presentAssets: {
  $sum: {
    $cond: [{ $eq: ["$isPresent", true] }, 1, 0],
  },
},

notPresentAssets: {
  $sum: {
    $cond: [{ $eq: ["$isPresent", false] }, 1, 0],
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
      presentAssets: item.presentAssets,
      notPresentAssets: item.notPresentAssets,
    };

    return acc;
  }, {});
}

export const projectRepository = {


async findRawById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  return Project.findById(id).lean();
},

async touchSyncById(id) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;

  return Project.findByIdAndUpdate(
    id,
    {
      $inc: { syncVersion: 1 },
      $currentDate: {
        updatedAt: true,
        lastSyncedChangeAt: true,
      },
    },
    {
      new: true,
      select: "_id syncVersion updatedAt lastSyncedChangeAt",
    }
  ).lean();
},


async findByInspectorUserIdAndCompanyId(userId, companyId) {
  if (!userId || !companyId) return [];

  const query = Project.find({
    companyId,
    "inspectionAssignments.inspectorUserId": String(userId),
  }).sort({ updatedAt: -1 });

  const projects = await populateProjectQuery(query).lean();

  const ids = projects.map((project) => project._id.toString());
  const statsMap = await getStatsMap(ids);

  return projects.map((project) =>
    mapProject(project, statsMap[project._id.toString()] ?? emptyStats)
  );
},

async findInspectorFilesByProjectId(projectId) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) return null;

  const project = await Project.findById(projectId)
    .select("inspectorFiles locations companyId userId name")
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


async findByInspectorUserId(userId) {
  if (!userId) return [];

  const query = Project.find({
    "inspectionAssignments.inspectorUserId": String(userId),
  }).sort({ updatedAt: -1 });

  const projects = await populateProjectQuery(query).lean();

  const ids = projects.map((project) => project._id.toString());
  const statsMap = await getStatsMap(ids);

  return projects.map((project) =>
    mapProject(project, statsMap[project._id.toString()] ?? emptyStats)
  );
},

async findInspectorFileById(projectId, fileId) {
  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) return null;

  const project = await Project.findById(projectId)
    .select("inspectorFiles locations companyId userId name")
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
  isFavorite = false,
  reportType = "simple",
  reportData = {},


   inspectionLocation = "",
  inspectionMapUrl = "",
  inspectionDate = null,
   locations = [],
 
  inspectorFiles = [],
}) {
  const project = new Project({
    name,
    companyId,
    userId,
    workflowStatus,
    reportType,
    isFavorite,
    reportData,

 inspectionLocation,
    inspectionMapUrl,
    inspectionDate,


     locations,
    
    inspectorFiles,
  });

  await project.save();
  await project.populate("companyId", "name");
  await project.populate("userId", "username role");

  return mapProject(project.toObject(), emptyStats);
},

  async findByCompanyId(companyId) {
    const query = Project.find({ companyId }).sort({ updatedAt: -1 });
    const projects = await populateProjectQuery(query).lean();

    const ids = projects.map((project) => project._id.toString());
    const statsMap = await getStatsMap(ids);

    return projects.map((project) =>
      mapProject(project, statsMap[project._id.toString()] ?? emptyStats)
    );
  },


  async addInspectorFile(projectId, file) {
  if (
    !projectId ||
    !mongoose.Types.ObjectId.isValid(projectId)
  ) {
    return null;
  }

  const project = await populateProjectQuery(
    Project.findByIdAndUpdate(
      projectId,
      {
        $push: {
          inspectorFiles: file,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
  ).lean();

  if (!project) return null;

  const statsMap = await getStatsMap([
    project._id.toString(),
  ]);

  return mapProject(
    project,
    statsMap[project._id.toString()] ?? emptyStats
  );
},

async updateById(id, update) {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;


  const project = await populateProjectQuery(
    Project.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      timestamps: false,
    })
  ).lean();



  if (!project) return null;

  const statsMap = await getStatsMap([project._id.toString()]);

  return mapProject(project, statsMap[project._id.toString()] ?? emptyStats);
},

  async findByCompanyIdAndUserId(companyId, userId) {
    const query = Project.find({ companyId, userId }).sort({ updatedAt: -1 });
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