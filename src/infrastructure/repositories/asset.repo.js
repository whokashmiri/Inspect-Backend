import prisma from "../prisma.js";

const assetSelect = {
  id: true,
  name: true,
  serialNumber: true,
  writtenDescription: true,
  folderId: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  },
  images: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      publicId: true,
      createdAt: true,
    },
  },
  voiceNotes: {
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      url: true,
      publicId: true,
      duration: true,
      createdAt: true,
    },
  },
};

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
    return prisma.asset.create({
      data: {
        name,
        serialNumber,
        writtenDescription: writtenDescription || null,
        projectId,
        folderId: folderId || null,
        createdById,
        images: images?.length
          ? {
              create: images.map((item) => ({
                url: item.url,
                publicId: item.publicId || null,
              })),
            }
          : undefined,
        voiceNotes: voiceNotes?.length
          ? {
              create: voiceNotes.map((item) => ({
                url: item.url,
                publicId: item.publicId || null,
                duration: item.duration ?? null,
              })),
            }
          : undefined,
      },
      select: assetSelect,
    });
  },

  async findBySerialNumber(serialNumber) {
    return prisma.asset.findUnique({
      where: { serialNumber },
      select: {
        id: true,
        serialNumber: true,
      },
    });
  },

  async findByProjectIdAndFolderId(projectId, folderId = null) {
    return prisma.asset.findMany({
      where: {
        projectId,
        folderId,
      },
      orderBy: { createdAt: "desc" },
      select: assetSelect,
    });
  },
};