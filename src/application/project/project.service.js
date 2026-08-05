// application/project/project.service.js
import { randomUUID } from "node:crypto";
import { projectRepository } from "../../infrastructure/repositories/project.repo.js";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { folderRepository } from "../../infrastructure/repositories/folder.repo.js";
import { assetRepository } from "../../infrastructure/repositories/asset.repo.js";
import { createSignedInspectorFileUrl } from "../../infrastructure/spaces.js";
import { cloudinaryService } from "../shared/cloudinary.service.js";
import { AppError } from "../../utils/AppError.js";
import { touchProjectSync } from "./projectSync.helper.js";

const normalizeOptionalText = (value, fieldName) => {
  if (value === undefined) return undefined;
  if (value === null) return "";

  if (typeof value !== "string") {
    throw new AppError(`${fieldName} must be a string`, 400);
  }

  return value.trim();
};

const normalizeInspectionDate = (value) => {
  if (value === undefined) return undefined;

  if (value === null || value === "") {
    return {
      date: null,
      reportValue: "",
    };
  }

  const normalized = String(value).trim();

  const date = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00.000Z`)
    : new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    throw new AppError("Invalid inspection date", 400);
  }

  // Reject invalid dates such as 2026-02-31.
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(normalized) &&
    date.toISOString().slice(0, 10) !== normalized
  ) {
    throw new AppError("Invalid inspection date", 400);
  }

  return {
    date,
    reportValue: date.toISOString().slice(0, 10),
  };
};

export const projectService = {
  async create({ userId, name }) {
    if (!name?.trim()) throw new AppError("Project name is required", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if (!user.company?.id && !user.company?._id) {
      throw new AppError("User is not linked to a company", 400);
    }

    const project = await projectRepository.create({
      name: name.trim(),
      companyId: user.company.id || user.company._id,
      userId: user.id || user._id,
      workflowStatus: "new",
      locations: [],
      inspectorFiles: [],
      isFavorite: false,
    });

    return { project };
  },

  async list(userId, filters = {}) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const requestedCompanyId = filters.companyId
      ? String(filters.companyId)
      : null;

    const userCompanyId = user.company?.id || user.company?._id;

    const companyProjects = userCompanyId
      ? await projectRepository.findByCompanyId(userCompanyId)
      : [];

    const inspectorProjects = await projectRepository.findByInspectorUserId(
      user.id || user._id
    );

    const map = new Map();

    [...companyProjects, ...inspectorProjects].forEach((project) => {
      map.set(String(project.id || project._id), project);
    });

    let projects = Array.from(map.values());

    if (requestedCompanyId) {
      projects = projects.filter(
        (project) => String(project.companyId) === requestedCompanyId
      );
    }

    const companiesMap = new Map();

    projects.forEach((project) => {
      if (!project.companyId) return;

      companiesMap.set(String(project.companyId), {
        id: String(project.companyId),
        name: project.company?.name || "",
      });
    });

    return {
      projects,
      companies: Array.from(companiesMap.values()),
      selectedCompanyId: requestedCompanyId,
    };
  },

  async updateInspectionDetails({
  userId,
  projectId,
  inspectionLocation,
  inspectionMapUrl,
  inspectionDate,
}) {
  const currentProject = await this.getCompanyProjectOrThrow({
    userId,
    projectId,
  });

  const update = {};
  const reportData = {
    ...(currentProject.reportData || {}),
  };

  if (inspectionLocation !== undefined) {
    const location = normalizeOptionalText(
      inspectionLocation,
      "inspectionLocation"
    );

    update.inspectionLocation = location;
    reportData.inspectionLocation = location;
  }

  if (inspectionMapUrl !== undefined) {
    const mapUrl = normalizeOptionalText(
      inspectionMapUrl,
      "inspectionMapUrl"
    );

    update.inspectionMapUrl = mapUrl;
    reportData.inspectionMapUrl = mapUrl;
  }

  if (inspectionDate !== undefined) {
    const normalizedDate = normalizeInspectionDate(inspectionDate);

    update.inspectionDate = normalizedDate.date;
    reportData.inspectionDate = normalizedDate.reportValue;
  }

  if (Object.keys(update).length === 0) {
    throw new AppError(
      "No inspection details were provided",
      400
    );
  }

  // Keep older report-generation code compatible.
  update.reportData = reportData;

  const updatedProject = await projectRepository.updateById(
    projectId,
    update
  );

  if (!updatedProject) {
    throw new AppError("Project not found", 404);
  }

  await touchProjectSync(
    projectId,
    "project_inspection_details_updated"
  );

  return {
    project: updatedProject,
  };
},

  async updateWorkflow({ userId, projectId, workflowStatus, isFavorite }) {
    await this.getCompanyProjectOrThrow({ userId, projectId });

    const update = {};

    if (workflowStatus !== undefined) {
      if (!["new", "done"].includes(workflowStatus)) {
        throw new AppError("Invalid workflow status", 400);
      }

      update.workflowStatus = workflowStatus;
    }

    if (isFavorite !== undefined) {
      update.isFavorite = Boolean(isFavorite);
    }

    if (Object.keys(update).length === 0) {
      throw new AppError("No valid project fields provided", 400);
    }

    const updatedProject = await projectRepository.updateById(projectId, update);

    await touchProjectSync(projectId, "project_workflow_updated");

    return { project: updatedProject };
  },

  async offlineManifest({ userId, projectId }) {
    const project = await this.getCompanyProjectOrThrow({ userId, projectId });

    return {
      projectId: String(project.id || project._id),
      syncVersion: Number(project.syncVersion || 1),
      updatedAt: project.updatedAt || null,
      lastSyncedChangeAt:
        project.lastSyncedChangeAt ||
        project.updatedAt ||
        project.createdAt ||
        null,
    };
  },

  async offlineChanges({ userId, projectId, sinceVersion }) {
    const project = await this.getCompanyProjectOrThrow({ userId, projectId });

    const currentVersion = Number(project.syncVersion || 1);
    const clientVersion = Number(sinceVersion || 0);

    if (clientVersion >= currentVersion) {
      return {
        projectId: String(project.id || project._id),
        syncVersion: currentVersion,
        updatedAt: project.updatedAt || null,
        lastSyncedChangeAt:
          project.lastSyncedChangeAt ||
          project.updatedAt ||
          project.createdAt ||
          null,
        hasChanges: false,
        project: null,
        folders: [],
        assets: [],
        deletedFolders: [],
        deletedAssets: [],
      };
    }

    const [folders, assets] = await Promise.all([
      projectRepository.findFoldersForOffline
        ? projectRepository.findFoldersForOffline(projectId)
        : folderRepository.findByProjectId(projectId),

      projectRepository.findAssetsForOffline
        ? projectRepository.findAssetsForOffline(projectId)
        : assetRepository.findByProjectId(projectId),
    ]);

    return {
      projectId: String(project.id || project._id),
      syncVersion: currentVersion,
      updatedAt: project.updatedAt || null,
      lastSyncedChangeAt:
        project.lastSyncedChangeAt ||
        project.updatedAt ||
        project.createdAt ||
        null,
      hasChanges: true,
      project,
      folders: folders || [],
      assets: assets || [],
      deletedFolders: [],
      deletedAssets: [],
    };
  },

  async addProjectVideo({
  userId,
  projectId,
  publicId,
  name,
  locationIds,
}) {
  const project = await this.getCompanyProjectOrThrow({
    userId,
    projectId,
  });

  if (!publicId || typeof publicId !== "string" || !publicId.trim()) {
    throw new AppError("Cloudinary publicId is required", 400);
  }

  if (locationIds !== undefined && !Array.isArray(locationIds)) {
    throw new AppError("locationIds must be an array", 400);
  }

  const uploadedVideo = await cloudinaryService.getProjectVideo({
    projectId,
    publicId: publicId.trim(),
  });

  const normalizedLocationIds = [
    ...new Set(
      (locationIds || [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    ),
  ];

  const projectLocationIds = new Set(
    (project.locations || [])
      .map((location) => String(location.id || "").trim())
      .filter(Boolean)
  );

  const invalidLocationIds = normalizedLocationIds.filter(
    (locationId) => !projectLocationIds.has(locationId)
  );

  if (invalidLocationIds.length > 0) {
    throw new AppError(
      "One or more project locations are invalid",
      400
    );
  }

  const normalizedName =
    name === undefined || name === null
      ? ""
      : normalizeOptionalText(name, "name");

  const videoFile = {
    id: randomUUID(),
    name:
      normalizedName ||
      `project-video.${uploadedVideo.format || "mp4"}`,
    type: "video",
    url: uploadedVideo.url,
    uploadedBy: userId,
    createdAt: new Date(),

    storage: "cloudinary",
    spacesKey: null,
    publicId: uploadedVideo.publicId,

    mimeType: uploadedVideo.mimeType || "video/mp4",
    sizeBytes: Number(uploadedVideo.sizeBytes || 0),
    duration: uploadedVideo.duration ?? null,
    thumbnailUrl: uploadedVideo.thumbnailUrl ?? null,
    locationIds: normalizedLocationIds,
  };

  const updatedProject =
    await projectRepository.addInspectorFile(
      projectId,
      videoFile
    );

  if (!updatedProject) {
    throw new AppError("Project not found", 404);
  }

  await touchProjectSync(
    projectId,
    "project_video_added"
  );

  return {
    video: videoFile,
    project: updatedProject,
  };
},

  async listInspectorFiles({ userId, projectId }) {
    await this.getCompanyProjectOrThrow({ userId, projectId });

    const result = await projectRepository.findInspectorFilesByProjectId(
      projectId
    );

    return {
      files: result?.inspectorFiles || [],
    };
  },

  async getInspectorFile({ userId, projectId, fileId }) {
    await this.getCompanyProjectOrThrow({ userId, projectId });

    const result = await projectRepository.findInspectorFileById(
      projectId,
      fileId
    );

    if (!result?.file) {
      throw new AppError("Inspector file not found", 404);
    }

    return { file: result.file };
  },

  async listLocations({ userId, projectId }) {
    const project = await this.getCompanyProjectOrThrow({ userId, projectId });

    return {
      locations: (project.locations || []).map((location) => ({
        id: location.id,
        name: location.name,
        region: location.region,
        city: location.city,
        latitude: location.latitude ?? null,
        longitude: location.longitude ?? null,
        mapUrl: location.mapUrl || "",
        primaryPhone: location.primaryPhone || "",
        secondaryPhone: location.secondaryPhone || "",
        notes: location.notes || "",
        inspectorFiles: location.inspectorFiles || [],
      })),
    };
  },

async getInspectorFileDownloadUrl({
  userId,
  projectId,
  fileId,
}) {
  const { file } = await this.getInspectorFile({
    userId,
    projectId,
    fileId,
  });

  const storage =
    file.storage ||
    (file.publicId ? "cloudinary" : "digitalocean");

  if (storage === "cloudinary") {
    if (!file.url) {
      throw new AppError(
        "Cloudinary file URL not available",
        404
      );
    }

    return {
      url: file.url,
      file,
      expiresAt: null,
    };
  }

  if (storage !== "digitalocean") {
    throw new AppError(
      "Unsupported file storage provider",
      400
    );
  }

  if (!file.spacesKey && !file.url) {
    throw new AppError(
      "DigitalOcean file key not available",
      404
    );
  }

  const signedUrl =
    await createSignedInspectorFileUrl(file);

  return {
    url: signedUrl,
    file,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  };
},
  async getCompanyProjectOrThrow({ userId, projectId }) {
    if (!projectId) {
      throw new AppError("Project ID is required", 400);
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    const companyId = user.company?.id || user.company?._id;

    const hasCompanyAccess =
      companyId && String(project.companyId) === String(companyId);

    const hasInspectorAccess = (project.inspectionAssignments || []).some(
      (assignment) =>
        String(assignment.inspectorUserId) === String(user.id || user._id)
    );

    if (!hasCompanyAccess && !hasInspectorAccess) {
      throw new AppError("You do not have access to this project", 403);
    }

    return project;
  },
};