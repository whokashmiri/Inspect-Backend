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
  assetType: doc.assetType ?? "Other",
  brand: doc.brand ?? null,
  model: doc.model ?? null,
  manufactureYear: doc.manufactureYear ?? null,
    kilometersDriven: doc.kilometersDriven ?? null,
    isDone: doc.isDone ?? false,
    folderId: toId(doc.folder),

  projectId: toId(doc.project),
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
    manufactureYear,
    kilometersDriven,
    isDone,
    images,
    voiceNotes,
    projectId,
    folderId,
    createdById,
  }) {
    const asset = new Asset({
      name,
      writtenDescription,
      condition: condition ?? undefined,
      assetType: assetType || "Other",
      brand: brand ?? null,
      model: model ?? null,
      manufactureYear: manufactureYear ?? null,
      kilometersDriven: kilometersDriven ?? null,
      project: projectId,
      folder: folderId || null,
      createdBy: createdById,
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

  async updateById(
  assetId,
  {
    writtenDescription,
    condition,
    assetType,
    brand,
    model,
    manufactureYear,
    kilometersDriven,
    isDone,
    images,
    voiceNotes,
  }
) {
  const asset = await Asset.findById(assetId);
  if (!asset) return null;

  if (writtenDescription !== undefined) {
    asset.writtenDescription = writtenDescription ?? null;
  }

  if (condition !== undefined) {
  asset.condition = condition;
}

  if (assetType !== undefined) {
    asset.assetType = assetType || "Other";
  }

  if (brand !== undefined) {
    asset.brand = brand ?? null;
  }

  if (model !== undefined) {
    asset.model = model ?? null;
  }

  if (manufactureYear !== undefined) {
    asset.manufactureYear = manufactureYear ?? null;
  }

  if (kilometersDriven !== undefined) {
    asset.kilometersDriven = kilometersDriven ?? null;
  }

  if (isDone !== undefined) {
    asset.isDone = isDone;
  }

  if (images !== undefined) {
    asset.images = (images || []).map((item) => ({
      url: item.url,
      publicId: item.publicId || null,
    }));
  }

  if (voiceNotes !== undefined) {
    asset.voiceNotes = (voiceNotes || []).map((item) => ({
      url: item.url,
      publicId: item.publicId || null,
      duration: item.duration ?? null,
    }));
  }

  await asset.save();
  await asset.populate("createdBy", "fullName email");

  return mapAsset(asset.toObject());
},

  async findByProjectIdAndFolderId(projectId, folderId = null) {
    const query = Asset.find({
      project: projectId,
      folder: folderId,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email");

    const assets = await query.lean();
    return assets.map(mapAsset);
  },

  async searchByProjectId(projectId, search) {
    const query = {
      project: projectId,
      name: { $regex: search, $options: "i" },
    };

    const assets = await Asset.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "fullName email")
      .lean();

    return assets.map(mapAsset);
  },
};