import { Asset } from "../../models/Asset.js";

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

const mapImage = (image) => ({
  id: toId(image._id),
  url: image.url,
  publicId: image.publicId ?? null,
  createdAt: image.createdAt,
});

const mapVoiceNote = (note) => ({
  id: toId(note._id),
  url: note.url,
  publicId: note.publicId ?? null,
  duration: note.duration ?? null,
  createdAt: note.createdAt,
});

const mapAsset = (doc) => ({
  id: toId(doc._id),
  name: doc.name,
  writtenDescription: doc.writtenDescription ?? null,
  condition: doc.condition ?? null,
  assetType: doc.assetType ?? "other",
  brand: doc.brand ?? null,
  model: doc.model ?? null,
  code: doc.code ?? null,
  manufactureYear: doc.manufactureYear ?? null,
  kilometersDriven: doc.kilometersDriven ?? null,
  isDone: doc.isDone ?? false,
  isPresent: doc.isPresent ?? true,

  // ✅ NEW STRUCTURE
  parentSubProjectId: toId(doc.parentSubProjectId),
  projectId: toId(doc.projectId),

  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,

  createdBy: mapCreatedBy(doc.createdBy),

  images: (doc.images || []).map(mapImage),
  voiceNotes: (doc.voiceNotes || []).map(mapVoiceNote),
});

export const assetRepository = {
  async create({
    name,
    writtenDescription,
    condition,
    assetType,
    brand,
    model,
    code,
    manufactureYear,
    kilometersDriven,
    isDone,
    isPresent,
    images,
    voiceNotes,
    projectId,
    parentSubProjectId,
    createdBy,
  }) {
    const asset = new Asset({
      name,
      writtenDescription,
      condition: condition ?? null,
      assetType: assetType || "other",
      brand: brand ?? null,
      model: model ?? null,
      code: code ?? null,
      manufactureYear: manufactureYear ?? null,
      kilometersDriven: kilometersDriven ?? null,

      projectId,
      parentSubProjectId: parentSubProjectId || null,
      createdBy,

      images: (images || []).map((item) => ({
        url: item.url,
        publicId: item.publicId || null,
      })),

      voiceNotes: (voiceNotes || []).map((item) => ({
        url: item.url,
        publicId: item.publicId || null,
        duration: item.duration ?? null,
      })),

      isDone: isDone ?? false,
      isPresent: isPresent ?? true,
      isAssetFolder: true,
    });

    await asset.save();
    await asset.populate("createdBy", "fullName email");

    return mapAsset(asset.toObject());
  },

  async findById(assetId) {
    const asset = await Asset.findById(assetId)
      .populate("createdBy", "fullName email")
      .lean();

    return asset ? mapAsset(asset) : null;
  },

  async updateById(assetId, updates) {
    const asset = await Asset.findById(assetId);
    if (!asset) return null;

    Object.keys(updates).forEach((key) => {
      if (updates[key] !== undefined) {
        asset[key] = updates[key];
      }
    });

    await asset.save();
    await asset.populate("createdBy", "fullName email");

    return mapAsset(asset.toObject());
  },

  async findByProjectIdAndCode(projectId, code) {
    const asset = await Asset.findOne({
      projectId,
      code,
    })
      .populate("createdBy", "fullName email")
      .lean();

    return asset ? mapAsset(asset) : null;
  },

  // ✅ UPDATED FUNCTION NAME
  async findByProjectIdAndParentSubProjectId(
    projectId,
    parentSubProjectId = null
  ) {
    const assets = await Asset.find({
      projectId,
      parentSubProjectId,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email")
      .lean();

    return assets.map(mapAsset);
  },

  async searchByProjectId(projectId, search) {
    const assets = await Asset.find({
      projectId,
      name: { $regex: search, $options: "i" },
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email")
      .lean();

    return assets.map(mapAsset);
  },
};