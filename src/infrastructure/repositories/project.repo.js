import prisma from "../prisma.js";

export const projectRepository = {
  async create({ name, companyId, createdById }) {
    return prisma.project.create({
      data: {
        name,
        companyId,
        createdById,
        status: "New",
        isFavorite: false,
      },
      select: {
        id: true,
        name: true,
        status: true,
        isFavorite: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
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

  async findByCompanyId(companyId) {
    return prisma.project.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        isFavorite: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
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

  async findByCompanyIdAndCreatedById(companyId, createdById) {
    return prisma.project.findMany({
      where: {
        companyId,
        createdById,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        status: true,
        isFavorite: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
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
    return prisma.project.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        companyId: true,
        createdById: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
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