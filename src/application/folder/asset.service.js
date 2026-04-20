
//asset.service.js
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
    model,
    isPresent,
    code,
    manufactureYear,
    kilometersDriven,
    isDone,
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
    const normalizedCode = code?.trim() || null;
    const normalizedAssetType = assetType === "Vehicle" ? "Vehicle" : "Other";
    const normalizedCondition =
      condition && ["New", "Used", "Damaged" , "Good"].includes(condition)
        ? condition
        : undefined;

    const normalizedBrand =
      normalizedAssetType === "Vehicle" ? brand?.trim() || null : null;
    const normalizedModel =
      normalizedAssetType === "Vehicle" ? model?.trim() || null : null;

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
      model: normalizedModel,
      code: normalizedCode,
      manufactureYear: normalizedManufactureYear,
      kilometersDriven: normalizedKilometersDriven,
      isDone: isDone !== undefined ? isDone : false,
      isPresent: isPresent !== undefined ? isPresent : true,
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



async updateAsset({
  userId,
  assetId,
  writtenDescription,
  condition,
  assetType,
  brand,
  model,
  code,
  manufactureYear,
  kilometersDriven,
  isPresent,
  isDone,
  imageFiles,
  voiceNoteFiles,
}) {
  console.log('Service isDone:', isDone);
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (!user.company?.id) {
    throw new AppError("User is not linked to a company", 400);
  }

  const existingAsset = await assetRepository.findById(assetId);
  if (!existingAsset) {
    throw new AppError("Asset not found", 404);
  }

  await getAccessibleProject(existingAsset.projectId, user);
  const normalizedCode = code?.trim() || null;
  const normalizedAssetType = assetType === "Vehicle" ? "Vehicle" : "Other";

  const normalizedCondition =
    condition && ["New", "Used", "Damaged"].includes(condition)
      ? condition
      : undefined;

  const normalizedBrand =
    normalizedAssetType === "Vehicle" ? brand?.trim() || null : null;

  const normalizedModel =
    normalizedAssetType === "Vehicle" ? model?.trim() || null : null;

  const normalizedManufactureYear =
    normalizedAssetType === "Vehicle"
      ? manufactureYear?.trim() || null
      : null;

  const normalizedKilometersDriven =
    normalizedAssetType === "Vehicle"
      ? kilometersDriven?.trim() || null
      : null;

  const uploadKey = `${existingAsset.projectId}_${Date.now()}`;

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


  const images = [...(existingAsset.images || []), ...uploadedImages];
  const voiceNotes = [...(existingAsset.voiceNotes || []), ...uploadedVoiceNotes];

  const updatedAsset = await assetRepository.updateById(assetId, {
    writtenDescription:
      writtenDescription === undefined
        ? existingAsset.writtenDescription
        : writtenDescription?.trim() || null,
    
    condition:
    condition === undefined
    ? existingAsset.condition
    : normalizedCondition,

assetType:
  assetType === undefined
    ? existingAsset.assetType
    : normalizedAssetType,

brand:
  brand === undefined
    ? existingAsset.brand
    : normalizedBrand,

model:
  model === undefined
    ? existingAsset.model
    : normalizedModel,
  code:
    code === undefined
      ? existingAsset.code
      : normalizedCode,

manufactureYear:
  manufactureYear === undefined
    ? existingAsset.manufactureYear
    : normalizedManufactureYear,

    kilometersDriven:
      kilometersDriven === undefined
        ? existingAsset.kilometersDriven
        : normalizedKilometersDriven,
    isDone:
      isDone === undefined
        ? existingAsset.isDone
        : isDone,
    isPresent: 
    isPresent === undefined
      ? existingAsset.isPresent
      : isPresent,
    images,
    voiceNotes,
  });

  return { asset: updatedAsset };
},


async getAssetByCode({ userId, projectId, code }) {
  if (!code?.trim()) throw new AppError("Code is required", 400);
  console.log("LOOKUP CODE:", code);

  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (!user.company?.id) {
    throw new AppError("User is not linked to a company", 400);
  }

  await getAccessibleProject(projectId, user);

  const asset = await assetRepository.findByProjectIdAndCode(
    projectId,
    code.trim()
  );

  if (!asset) throw new AppError("Asset not found", 404);

  return { asset };
}

};