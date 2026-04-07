import prisma from "../prisma.js";

export const userRepository = {
  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,            // ✅ added
        role: true,                // ✅ added
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
        fullName: true,            // ✅ added
        role: true,                // ✅ added
        createdAt: true,
        company: { select: { name: true } },
      },
    });
  },

  async create({ email, fullName, role, passwordHash, companyName }) {
    return prisma.user.create({
      data: {
        email,
        fullName,                 // ✅ added
        role,                     // ✅ added
        passwordHash,
        company: { create: { name: companyName } },
      },
      select: {
        id: true,
        email: true,
        fullName: true,           // ✅ added
        role: true,               // ✅ added
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