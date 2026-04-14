import { AppError } from "../../utils/AppError.js";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { projectRepository } from "../../infrastructure/repositories/project.repo.js";
import { folderRepository } from "../../infrastructure/repositories/folder.repo.js";
import { assetRepository } from "../../infrastructure/repositories/asset.repo.js";
import { cloudinaryService } from "../shared/cloudinary.service.js";

async function getAccessibleProject(projectId, user) {
  const project = await projectRepository.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  if (project.companyId !== user.company.id) {
    throw new AppError("Forbidden", 403);
  }

  if (user.role !== "Manager" && project.createdById !== user.id) {
    throw new AppError("Forbidden", 403);
  }

  return project;
}

export const folderAssetService = {
  async createFolder({ userId, projectId, parentId, name }) {
    if (!name?.trim()) throw new AppError("Folder name is required", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (!user.company?.id) {
      throw new AppError("User is not linked to a company", 400);
    }

    await getAccessibleProject(projectId, user);

    if (parentId) {
      const parentFolder = await folderRepository.findById(parentId);
      if (!parentFolder || parentFolder.projectId !== projectId) {
        throw new AppError("Parent folder not found in this project", 404);
      }
    }

    const folder = await folderRepository.create({
      name: name.trim(),
      projectId,
      parentId,
      createdById: user.id,
    });

    return { folder };
  },

  async createAsset({
    userId,
    projectId,
    folderId,
    name,
    writtenDescription,
    condition,
    assetType,
    brand,
    manufactureYear,
    kilometersDriven,
    imageFiles,
    voiceNoteFiles,
  }) {
    if (!name?.trim()) throw new AppError("Asset name is required", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (!user.company?.id) {
      throw new AppError("User is not linked to a company", 400);
    }

    await getAccessibleProject(projectId, user);

    if (folderId) {
      const folder = await folderRepository.findById(folderId);
      if (!folder || folder.projectId !== projectId) {
        throw new AppError("Folder not found in this project", 404);
      }
    }

    const normalizedAssetType = assetType === "Vehicle" ? "Vehicle" : "Other";
    const normalizedCondition =
      condition && ["New", "Used", "Damaged"].includes(condition)
        ? condition
        : null;

    const normalizedBrand =
      normalizedAssetType === "Vehicle" ? brand?.trim() || null : null;

    const normalizedManufactureYear =
      normalizedAssetType === "Vehicle"
        ? manufactureYear?.trim() || null
        : null;

    const normalizedKilometersDriven =
      normalizedAssetType === "Vehicle"
        ? kilometersDriven?.trim() || null
        : null;

    const uploadKey = `${projectId}_${Date.now()}`;

    const uploadedImages = await Promise.all(
      (imageFiles || []).map((file) =>
        cloudinaryService.uploadImage(file, uploadKey)
      )
    );

    const uploadedVoiceNotes = await Promise.all(
      (voiceNoteFiles || []).map((file) =>
        cloudinaryService.uploadVoiceNote(file, uploadKey)
      )
    );

    const asset = await assetRepository.create({
      name: name.trim(),
      writtenDescription: writtenDescription?.trim() || null,
      condition: normalizedCondition,
      assetType: normalizedAssetType,
      brand: normalizedBrand,
      manufactureYear: normalizedManufactureYear,
      kilometersDriven: normalizedKilometersDriven,
      images: uploadedImages,
      voiceNotes: uploadedVoiceNotes,
      projectId,
      folderId: folderId || null,
      createdById: user.id,
    });

    return { asset };
  },

  async listContents({ userId, projectId, parentId }) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (!user.company?.id) {
      throw new AppError("User is not linked to a company", 400);
    }

    await getAccessibleProject(projectId, user);

    if (parentId) {
      const folder = await folderRepository.findById(parentId);
      if (!folder || folder.projectId !== projectId) {
        throw new AppError("Folder not found in this project", 404);
      }
    }

    const [folders, assets] = await Promise.all([
      folderRepository.findByProjectIdAndParentId(projectId, parentId || null),
      assetRepository.findByProjectIdAndFolderId(projectId, parentId || null),
    ]);

    return {
      parentId: parentId || null,
      folders,
      assets,
    };
  },
};