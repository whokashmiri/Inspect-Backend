// asset.service.js
import { AppError } from "../../utils/AppError.js";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { projectRepository } from "../../infrastructure/repositories/project.repo.js";
import { folderRepository } from "../../infrastructure/repositories/folder.repo.js";
import { assetRepository } from "../../infrastructure/repositories/asset.repo.js";
import { Project } from "../../models/Project.js"

import { touchProjectSync } from "../project/projectSync.helper.js";

async function getAccessibleProject(projectId, user) {
  const project = await projectRepository.findById(projectId);
  if (!project) throw new AppError("Project not found", 404);

  const userId = String(user.id || user._id);

  const userCompanyId =
    user.company && typeof user.company === "object"
      ? user.company.id || user.company._id
      : user.company;

  const hasCompanyAccess =
    userCompanyId && String(project.companyId) === String(userCompanyId);

  const hasInspectorAccess = (project.inspectionAssignments || []).some(
    (assignment) => String(assignment.inspectorUserId) === userId
  );

  if (!hasCompanyAccess && !hasInspectorAccess) {
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
  return value || null;
}


function normalizeQuantity(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue < 1) {
    return 1;
  }

  return Math.floor(numberValue);
}

function normalizeSubAssetType(value) {
  if (value === undefined) return undefined;

  const text = String(value || "")
    .trim()
    .toLowerCase();

  return text || null;
}

function cleanRawData(rawData) {
  const cleaned =
    rawData && typeof rawData === "object" && !Array.isArray(rawData)
      ? { ...rawData }
      : {};

  delete cleaned.quantity;
  delete cleaned.subAssetType;
  delete cleaned.customAssetType;

  return cleaned;
}

function normalizeNotes(notes) {
  const notesText = String(notes || "").trim();

  return {
    notes: notesText || null,
    hasNotes: notesText.length > 0,
  };
}

function normalizeOptionalString(value) {
  if (value === undefined) return undefined;
  return value?.trim() || null;
}

function normalizeVehicleOnlyField(assetType, value) {
  if (value === undefined) return undefined;
  return assetType === "vehicle" ? value?.trim() || null : null;
}


async function touchProject(projectId) {
  if (!projectId) return;

  await Project.updateOne(
    { _id: projectId },
    { $currentDate: { updatedAt: true } }
  );
}
function sanitizeVoiceNotes(voiceNotes = []) {
  if (!Array.isArray(voiceNotes)) return [];

  return voiceNotes
    .filter((item) => item?.url && item?.publicId)
    .map((item) => ({
      url: item.url,
      publicId: item.publicId,
      duration:
        typeof item.duration === "number"
          ? Math.round(item.duration)
          : null,
    }));
}

// --- Image helpers -------------------------------------------------------
// Images are now stored as a structured object rather than a flat array:
//   Vehicle assets: { plate, details, odometer, other[] }
//   Other assets:   { details, brand, other[] }
// (Whichever slots don't apply to the asset's assetType get cleared by the
// model's pre("validate") hook on save, so this layer doesn't need to know
// assetType to do its job.)

// Sanitizes a single image object (used for plate/details/odometer/brand
// and for each item inside "other"). Mirrors the previous per-item logic
// that used to run over the old flat array.
function sanitizeSingleImage(item) {
  if (!item || typeof item !== "object") return null;

  const url = typeof item.url === "string" ? item.url.trim() : "";
  if (!url) return null;

  const mediaType =
    item.mediaType === "video" ||
    item.mimeType?.startsWith?.("video/") ||
    url.includes("/video/upload/") ||
    url.toLowerCase().endsWith(".mp4") ||
    url.toLowerCase().endsWith(".mov")
      ? "video"
      : "image";

  return {
    url,
    publicId: item.publicId ?? null,
    mediaType,
    mimeType:
      item.mimeType ?? (mediaType === "video" ? "video/mp4" : "image/jpeg"),
    duration:
      mediaType === "video" && typeof item.duration === "number"
        ? Math.round(item.duration)
        : null,
    thumbnailUrl: mediaType === "video" ? item.thumbnailUrl ?? null : null,
  };
}

// Sanitizes only the slots that are actually present on the incoming
// object, so callers can tell "not provided" (key absent) apart from
// "explicitly cleared" (key present but null/invalid -> sanitized to null).
function sanitizeImagesPartial(images) {
  if (!images || typeof images !== "object" || Array.isArray(images)) {
    return {};
  }

  const result = {};

  if ("plate" in images) result.plate = sanitizeSingleImage(images.plate);
  if ("details" in images) result.details = sanitizeSingleImage(images.details);
  if ("odometer" in images) result.odometer = sanitizeSingleImage(images.odometer);
  if ("brand" in images) result.brand = sanitizeSingleImage(images.brand);

  if ("other" in images) {
    result.other = Array.isArray(images.other)
      ? images.other.map(sanitizeSingleImage).filter(Boolean)
      : [];
  }

  return result;
}

// Builds a fully-shaped images object for a brand-new asset.
function buildFullImages(images) {
  const partial = sanitizeImagesPartial(images);

  return {
    plate: partial.plate ?? null,
    details: partial.details ?? null,
    odometer: partial.odometer ?? null,
    brand: partial.brand ?? null,
    other: partial.other ?? [],
  };
}

// Merges an incoming (possibly partial) images payload into the asset's
// existing images:
//  - single-image slots (plate/details/odometer/brand) are REPLACED when
//    provided (re-uploading a slot's photo swaps it, it doesn't stack)
//  - the "other" array is MERGED without duplicates when provided
//  - any slot not present in the incoming payload is left untouched
function mergeImages(existingImages = {}, incomingImages) {
  if (incomingImages === undefined) return existingImages;

  const partial = sanitizeImagesPartial(incomingImages);
  const next = { ...existingImages };

  if ("plate" in partial) next.plate = partial.plate;
  if ("details" in partial) next.details = partial.details;
  if ("odometer" in partial) next.odometer = partial.odometer;
  if ("brand" in partial) next.brand = partial.brand;

  if ("other" in partial) {
    next.other = mergeMediaWithoutDuplicates(
      existingImages.other || [],
      partial.other
    );
  }

  return next;
}


function getMediaKey(item = {}) {
  return item.publicId || item.url || item.uri || null;
}

function mergeMediaWithoutDuplicates(existingItems = [], incomingItems = []) {
  const seen = new Set();
  const result = [];

  const addItem = (item) => {
    if (!item) return;

    const key = getMediaKey(item);
    if (!key) return;

    if (seen.has(key)) return;

    seen.add(key);
    result.push(item);
  };

  existingItems.forEach(addItem);
  incomingItems.forEach(addItem);

  return result;
}
export const folderAssetService = {
  async createFolder({ userId, projectId, parentId, name }) {
    if (!name?.trim()) throw new AppError("Folder name is required", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    // if (!user.company?.id) {
    //   throw new AppError("User is not linked to a company", 400);
    // }

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
  createdById: user.id || user._id,
});

await touchProjectSync(projectId, "folder_created");

return { folder };
  },

 async createAsset({
  userId,
  projectId,
  parent,
  folderId,
  name,
  condition,
  assetType,
  subAssetType,
  quantity,
  rawData,
  brand,
  model,
  isPresent,
  code,
  manufactureYear,
  kilometersDriven,
  isDone,
  notes,
  images,
  voiceNotes,
}) {
    if (!name?.trim()) throw new AppError("Asset name is required", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    // if (!user.company?.id) {
    //   throw new AppError("User is not linked to a company", 400);
    // }

    await getAccessibleProject(projectId, user);

    const resolvedParentSubProjectId = parent ?? folderId ?? null;

    if (resolvedParentSubProjectId) {
      const folder = await folderRepository.findById(resolvedParentSubProjectId);
      if (!folder || folder.projectId.toString() !== projectId.toString()) {
        throw new AppError("Folder not found in this project", 404);
      }
    }

    const normalizedAssetType = normalizeAssetType(assetType);
    const normalizedCondition = normalizeCondition(condition);
    const normalizedCode = normalizeOptionalString(code);
const incomingRawData =
  rawData && typeof rawData === "object" && !Array.isArray(rawData)
    ? rawData
    : {};

const normalizedQuantity = normalizeQuantity(quantity);

const normalizedSubAssetType =
  normalizeSubAssetType(subAssetType) ??
  (normalizedAssetType === "vehicle" ? "vehicle" : null);

const normalizedNotes = normalizeNotes(notes);
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

  
const finalRawData = cleanRawData(incomingRawData);


    
   const asset = await assetRepository.create({
  name: name.trim(),
  condition: normalizedCondition,
  assetType: normalizedAssetType,

  subAssetType: normalizedSubAssetType,
  quantity: normalizedQuantity,
  rawData: finalRawData,

  brand: normalizedBrand,
  model: normalizedModel,
  code: normalizedCode,
  manufactureYear: normalizedManufactureYear,
  kilometersDriven: normalizedKilometersDriven,

  isDone: isDone !== undefined ? isDone : false,
  isPresent: isPresent !== undefined ? isPresent : true,

  images: buildFullImages(images),
  voiceNotes: sanitizeVoiceNotes(voiceNotes),

  projectId,
  parent: resolvedParentSubProjectId,

  hasNotes: normalizedNotes.hasNotes,
  notes: normalizedNotes.notes,

  isAssetFolder: true,
  createdBy: user.id || user._id,
});

    await touchProjectSync(projectId, "asset_created");

    return { asset };
  },

  async listContents({ userId, projectId, parentId }) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    // if (!user.company?.id) {
    //   throw new AppError("User is not linked to a company", 400);
    // }

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
  condition,
  assetType,
  subAssetType,
  quantity,
  rawData,
  brand,
  model,
  code,
  manufactureYear,
  kilometersDriven,
  isPresent,
  isDone,
  notes,
  images,
  voiceNotes,
}) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    // if (!user.company?.id) {
    //   throw new AppError("User is not linked to a company", 400);
    // }

    const existingAsset = await assetRepository.findById(assetId);
    if (!existingAsset) {
      throw new AppError("Asset not found", 404);
    }

    await getAccessibleProject(existingAsset.projectId, user);

const currentUserId = String(user.id || user._id);
const assetCreatorId = existingAsset.createdBy?.id?.toString();
const isCreator = assetCreatorId === currentUserId;


    const nextAssetType =
      assetType === undefined
        ? normalizeAssetType(existingAsset.assetType)
        : normalizeAssetType(assetType);

    const normalizedCondition = normalizeCondition(condition);
    const normalizedCode = normalizeOptionalString(code);

    const incomingRawData =
  rawData && typeof rawData === "object" && !Array.isArray(rawData)
    ? rawData
    : existingAsset.rawData || {};

const cleanedIncomingRawData = cleanRawData(incomingRawData);

const nextQuantity =
  quantity === undefined
    ? existingAsset.quantity || 1
    : normalizeQuantity(quantity);

const nextSubAssetType =
  subAssetType === undefined
    ? normalizeSubAssetType(existingAsset.subAssetType)
    : normalizeSubAssetType(subAssetType) ??
      (nextAssetType === "vehicle" ? "vehicle" : null);

const normalizedNotes =
  notes === undefined
    ? {
        notes: existingAsset.notes,
        hasNotes: !!existingAsset.notes?.trim?.(),
      }
    : normalizeNotes(notes);

  
// images comes back from findById already in the structured
// { plate, details, odometer, brand, other[] } shape (see asset.repo.js
// mapImages). mergeImages replaces single slots that were provided and
// merges the "other" array without duplicates; anything not sent in this
// request is left as-is.
const nextImages = mergeImages(existingAsset.images || {}, images);

const existingVoiceNotes = sanitizeVoiceNotes(existingAsset.voiceNotes || []);
const incomingVoiceNotes =
  voiceNotes === undefined ? undefined : sanitizeVoiceNotes(voiceNotes);

const nextVoiceNotes =
  incomingVoiceNotes === undefined
    ? existingVoiceNotes
    : mergeMediaWithoutDuplicates(existingVoiceNotes, incomingVoiceNotes);;

const nextRawData = cleanedIncomingRawData;

const updatedAsset = await assetRepository.updateById(assetId, {
  name:
    !isCreator
      ? existingAsset.name
      : name === undefined
      ? existingAsset.name
      : name?.trim() || existingAsset.name,

  condition:
    condition === undefined
      ? existingAsset.condition
      : normalizedCondition,

  assetType:
    assetType === undefined
      ? existingAsset.assetType
      : nextAssetType,

  subAssetType: nextSubAssetType,
  quantity: nextQuantity,
  rawData: nextRawData,

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

  hasNotes: normalizedNotes.hasNotes,
  notes: normalizedNotes.notes,

  isDone:
    isDone === undefined
      ? existingAsset.isDone
      : isDone,

  isPresent:
    isPresent === undefined
      ? existingAsset.isPresent
      : isPresent,

  images: nextImages,
  voiceNotes: nextVoiceNotes,
});

    await touchProjectSync(existingAsset.projectId, "asset_updated");

    return { asset: updatedAsset };
  },

  async getAssetByCode({ userId, projectId, code }) {
    if (!code?.trim()) throw new AppError("Code is required", 400);

    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    // if (!user.company?.id) {
    //   throw new AppError("User is not linked to a company", 400);
    // }

    await getAccessibleProject(projectId, user);

    const asset = await assetRepository.findByProjectIdAndCode(
      projectId,
      code.trim()
    );

    if (!asset) throw new AppError("Asset not found", 404);

    return { asset };
  },

  async deleteAsset({ userId, assetId }) {
  const user = await userRepository.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // if (!user.company?.id) {
  //   throw new AppError("User is not linked to a company", 400);
  // }

  const existingAsset = await assetRepository.findById(assetId);

  if (!existingAsset) {
    throw new AppError("Asset not found", 404);
  }

  await getAccessibleProject(existingAsset.projectId, user);

  const currentUserId = String(user.id || user._id);
  const assetCreatorId = existingAsset.createdBy?.id?.toString();

  const isCreator = assetCreatorId === currentUserId;

  if (!isCreator) {
    throw new AppError(
      "Only the asset creator can delete this asset",
      403
    );
  }

  await assetRepository.deleteById(assetId);
  await touchProjectSync(existingAsset.projectId, "asset_deleted");

  return {
    success: true,
    message: "Asset deleted successfully",
  };
},

async advancedGetRawDataKeys({ userId, projectId }) {
  return assetRepository.advancedGetRawDataKeys({
    userId,
    projectId,
  });
},


async advancedSearchContents({
  userId,
  projectId,
  filters,
  search,
  filter,
  page,
  limit,
}) {
  return assetRepository.advancedSearchContents({
    userId,
    projectId,
    filters,
    search,
    filter,
    page,
    limit,
  });
},

async advancedGetRawDataKeyValues({ userId, projectId, key }) {
  return assetRepository.advancedGetRawDataKeyValues({
    userId,
    projectId,
    key,
  });
},

async getProjectSubAssetTypes({ userId, projectId }) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  await getAccessibleProject(projectId, user);

  const subAssetTypes = await assetRepository.getUniqueSubAssetTypes(projectId);

  return {
    subAssetTypes,
  };
},

async getProjectConditions({ userId, projectId }) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  await getAccessibleProject(projectId, user);

  const conditions = await assetRepository.getUniqueConditions(projectId);

  return {
    conditions,
  };
},

async renameProjectSubAssetType({
  userId,
  projectId,
  oldSubAssetType,
  newSubAssetType,
  parent,
}) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  await getAccessibleProject(projectId, user);

  const oldValue = String(oldSubAssetType || "").trim().toLowerCase();
  const newValue = String(newSubAssetType || "").trim().toLowerCase();

  if (!oldValue) {
    throw new AppError("Old sub asset type is required", 400);
  }

  if (!newValue) {
    throw new AppError("New sub asset type is required", 400);
  }

  const result = await assetRepository.renameSubAssetType({
    projectId,
    oldSubAssetType: oldValue,
    newSubAssetType: newValue,
    parent,
  });

  await touchProjectSync(projectId, "sub_asset_type_renamed");

  return {
    success: true,
    ...result,
  };
}
};