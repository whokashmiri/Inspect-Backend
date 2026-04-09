import prisma from "../prisma.js";

export const companyRepository = {
  async findByName(name) {
    return prisma.company.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
  },

  async create({ name }) {
    return prisma.company.create({
      data: { name },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
  },
};