import prisma from "../prisma.js";

export const userRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        company: { select: { name: true } },
      },
    });
  },

  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        company: { select: { name: true } },
      },
    });
  },

  async create({ email, passwordHash, companyName }) {
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        company: { create: { name: companyName } },
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        company: { select: { name: true } },
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
