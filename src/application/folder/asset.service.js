// asset.service.js
import { AppError } from "../../utils/AppError.js";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { projectRepository } from "../../infrastructure/repositories/project.repo.js";
import { folderRepository } from "../../infrastructure/repositories/folder.repo.js";
import { assetRepository } from "../../infrastructure/repositories/asset.repo.js";
import { cloudinaryService } from "../shared/cloudinary.service.js";

async function getAccessibleProject(projectId, user) {
  const project = await projectRepository.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const projectCompanyId = project.companyId.toString();
  const userCompanyId =
    typeof user.company === "object"
      ? (user.company.id || user.company._id).toString()
      : user.company.toString();

  if (projectCompanyId !== userCompanyId) {
    throw new AppError("Forbidden", 403);
  }

  return project;
}

function normalizeAssetType(assetType) {
  if (!assetType) return "other";

  const value = String(assetType).trim().toLowerCase();
  return value === "vehicle" ? "vehicle" : "other";
}

function normalizeCondition(condition) {
  if (condition === undefined) return undefined;
  if (condition === null) return null;

  const value = String(condition).trim();
  return ["New", "Used", "Damaged", "Good"].includes(value) ? value : null;
}

function normalizeOptionalString(value) {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}

function normalizeVehicleOnlyField(assetType, value) {
  if (value === undefined) return undefined;
  return assetType === "vehicle" ? value?.trim() || null : null;
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
      if (!parentFolder || parentFolder.projectId.toString() !== projectId.toString()) {
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
    parentSubProjectId,
    folderId, // temporary compatibility if frontend still sends folderId
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

    const resolvedParentSubProjectId = parentSubProjectId ?? folderId ?? null;

    if (resolvedParentSubProjectId) {
      const folder = await folderRepository.findById(resolvedParentSubProjectId);
      if (!folder || folder.projectId.toString() !== projectId.toString()) {
        throw new AppError("Folder not found in this project", 404);
      }
    }

    const normalizedAssetType = normalizeAssetType(assetType);
    const normalizedCondition = normalizeCondition(condition);
    const normalizedCode = normalizeOptionalString(code);
    const normalizedWrittenDescription = normalizeOptionalString(writtenDescription);

    const normalizedBrand = normalizeVehicleOnlyField(normalizedAssetType, brand);
    const normalizedModel = normalizeVehicleOnlyField(normalizedAssetType, model);
    const normalizedManufactureYear = normalizeVehicleOnlyField(
      normalizedAssetType,
      manufactureYear
    );
    const normalizedKilometersDriven = normalizeVehicleOnlyField(
      normalizedAssetType,
      kilometersDriven
    );

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
      writtenDescription: normalizedWrittenDescription,
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
      parentSubProjectId: resolvedParentSubProjectId,
      isAssetFolder: true,
      createdBy: user.id,
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
      if (!folder || folder.projectId.toString() !== projectId.toString()) {
        throw new AppError("Folder not found in this project", 404);
      }
    }

    const [folders, assets] = await Promise.all([
      folderRepository.findByProjectIdAndParentId(projectId, parentId || null),
      assetRepository.findByProjectIdAndParentSubProjectId(
        projectId,
        parentId || null
      ),
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
    name,
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

    const nextAssetType =
      assetType === undefined
        ? normalizeAssetType(existingAsset.assetType)
        : normalizeAssetType(assetType);

    const normalizedCondition = normalizeCondition(condition);
    const normalizedCode = normalizeOptionalString(code);

    const uploadedImages = await Promise.all(
      (imageFiles || []).map((file) =>
        cloudinaryService.uploadImage(file, `${existingAsset.projectId}_${Date.now()}`)
      )
    );

    const uploadedVoiceNotes = await Promise.all(
      (voiceNoteFiles || []).map((file) =>
        cloudinaryService.uploadVoiceNote(file, `${existingAsset.projectId}_${Date.now()}`)
      )
    );

    const images = [...(existingAsset.images || []), ...uploadedImages];
    const voiceNotes = [...(existingAsset.voiceNotes || []), ...uploadedVoiceNotes];

    const updatedAsset = await assetRepository.updateById(assetId, {
      name:
        name === undefined
          ? existingAsset.name
          : name?.trim() || existingAsset.name,

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
          : nextAssetType,

      brand:
        brand === undefined
          ? existingAsset.brand
          : nextAssetType === "vehicle"
          ? brand?.trim() || null
          : null,

      model:
        model === undefined
          ? existingAsset.model
          : nextAssetType === "vehicle"
          ? model?.trim() || null
          : null,

      code:
        code === undefined
          ? existingAsset.code
          : normalizedCode,

      manufactureYear:
        manufactureYear === undefined
          ? existingAsset.manufactureYear
          : nextAssetType === "vehicle"
          ? manufactureYear?.trim() || null
          : null,

      kilometersDriven:
        kilometersDriven === undefined
          ? existingAsset.kilometersDriven
          : nextAssetType === "vehicle"
          ? kilometersDriven?.trim() || null
          : null,

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
  },
};