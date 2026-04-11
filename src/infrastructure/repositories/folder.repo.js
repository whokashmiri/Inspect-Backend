import prisma from "../prisma.js";

export const folderRepository = {
  async create({ name, projectId, parentId, createdById }) {
    return prisma.folder.create({
      data: {
        name,
        projectId,
        parentId: parentId || null,
        createdById,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        projectId: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },

  async findById(id) {
    return prisma.folder.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        projectId: true,
        parentId: true,
        createdById: true,
      },
    });
  },

  async findByProjectIdAndParentId(projectId, parentId = null) {
    return prisma.folder.findMany({
      where: {
        projectId,
        parentId,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        parentId: true,
        projectId: true,
        createdAt: true,
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  },
};