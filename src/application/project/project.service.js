// application/project/project.service.js
import { projectRepository } from "../../infrastructure/repositories/project.repo.js";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { createSignedInspectorFileUrl } from "../../infrastructure/spaces.js";
import { AppError } from "../../utils/AppError.js";

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
      userId: user.id,
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

  const updatedProject = await projectRepository.updateById(projectId, update);

  return { project: updatedProject };
},

 async listInspectorFiles({ userId, projectId }) {
  
  await this.getCompanyProjectOrThrow({ userId, projectId });

  const result = await projectRepository.findInspectorFilesByProjectId(projectId);

  return {
    files: result?.inspectorFiles || [],
  };
},

 async getInspectorFile({ userId, projectId, fileId }) {
  await this.getCompanyProjectOrThrow({ userId, projectId });

  const result = await projectRepository.findInspectorFileById(projectId, fileId);

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

async getInspectorFileDownloadUrl({ userId, projectId, fileId }) {
  const { file } = await this.getInspectorFile({
    userId,
    projectId,
    fileId,
  });

  if (!file.spacesKey) {
    throw new AppError("File storage key not available", 404);
  }

  const signedUrl = await createSignedInspectorFileUrl(file);

  return {
    url: signedUrl,
    file,
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