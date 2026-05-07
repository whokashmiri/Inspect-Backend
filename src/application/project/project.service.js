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
      contacts: [],
      inspectorFiles: [],
    });

    return { project };
  },

  async list(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);

    if (!user.company) {
      throw new AppError("User is not linked to a company", 400);
    }

    const companyId = user.company.id || user.company._id;
    const projects = await projectRepository.findByCompanyId(companyId);
    
    

    return { projects };
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

async listContacts({ userId, projectId }) {
  const project = await this.getCompanyProjectOrThrow({ userId, projectId });

  return {
    contacts: project.contacts || [],
  };
},

async listLocations({ userId, projectId }) {
  const project = await this.getCompanyProjectOrThrow({ userId, projectId });

  return {
    locations: project.locations || [],
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

    if (!user.company) {
      throw new AppError("User is not linked to a company", 400);
    }

    const companyId = user.company.id || user.company._id;

    const project = await projectRepository.findById(projectId);

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    if (String(project.companyId) !== String(companyId)) {
      throw new AppError("You do not have access to this project", 403);
    }

    return project;
  },
};