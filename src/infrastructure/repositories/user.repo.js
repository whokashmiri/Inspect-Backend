import prisma from "../prisma.js";

export const userRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        passwordHash: true,
        company: { select: { id: true, name: true } },
      },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
      },
    });
  },

  async findManagerByCompanyId(companyId) {
    return prisma.user.findFirst({
      where: {
        companyId,
        role: "Manager",
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
  },

  async create({ email, fullName, role, passwordHash, companyId }) {
    return prisma.user.create({
      data: {
        email,
        fullName,
        role,
        passwordHash,
        companyId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        company: { select: { id: true, name: true } },
      },
    });
  },

  async saveRefreshToken(userId, token, expiresAt) {
    await prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  },

  async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({ where: { token } });
  },

  async deleteRefreshToken(token) {
    await prisma.refreshToken.delete({ where: { token } });
  },

  async deleteAllRefreshTokens(userId) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  },
};