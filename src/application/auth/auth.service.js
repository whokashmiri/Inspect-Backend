import bcrypt from "bcryptjs";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { tokenService } from "./token.service.js";
import { AppError } from "../../utils/AppError.js";

export const authService = {
  async signup({ email, password, fullName, role, companyName }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new AppError("Email already in use", 409);

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await userRepository.create({
      email,
      fullName,               // ✅ added
      role,                   // ✅ added
      passwordHash,
      companyName,
    });

    return buildAuthResponse(user);
  },

  async login({ email, password }) {
    const record = await userRepository.findByEmail(email);
    if (!record) throw new AppError("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, record.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401);

    return buildAuthResponse(record);
  },

  async refresh(refreshToken) {
    const stored = await userRepository.findRefreshToken(refreshToken);
    if (!stored) throw new AppError("Invalid refresh token", 401);

    if (new Date(stored.expiresAt) < new Date()) {
      await userRepository.deleteRefreshToken(refreshToken);
      throw new AppError("Refresh token expired", 401);
    }

    const user = await userRepository.findById(stored.userId);

    await userRepository.deleteRefreshToken(refreshToken);

    return buildAuthResponse(user);
  },

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    return formatUser(user);
  },

  async logout(userId) {
    await userRepository.deleteAllRefreshTokens(userId);
  },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function buildAuthResponse(user) {
  const accessToken = tokenService.generateAccessToken({ sub: user.id });
  const refreshToken = tokenService.generateRefreshToken();
  const expiresAt = tokenService.refreshTokenExpiresAt();

  await userRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

  return {
    user: formatUser(user),
    tokens: { accessToken, refreshToken },
  };
}

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName ?? null,       // ✅ added
    role: user.role ?? null,               // ✅ added
    companyName: user.company?.name ?? null,
  };
}