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
  serialNumber: doc.serialNumber,
  writtenDescription: doc.writtenDescription ?? null,
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
    serialNumber,
    writtenDescription,
    images,
    voiceNotes,
    projectId,
    folderId,
    createdById,
  }) {
    const asset = new Asset({
      name,
      serialNumber,
      writtenDescription,
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
    });

    await asset.save();
    await asset.populate("createdBy", "fullName email");

    return mapAsset(asset.toObject());
  },

  async findBySerialNumber(serialNumber) {
    const doc = await Asset.findOne({ serialNumber }).lean();
    if (!doc) return null;
    return {
      id: toId(doc._id),
      serialNumber: doc.serialNumber,
    };
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
};
