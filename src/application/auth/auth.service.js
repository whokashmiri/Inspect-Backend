import bcrypt from "bcryptjs";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { tokenService } from "./token.service.js";
import { AppError } from "../../utils/AppError.js";

export const authService = {
  async login({ username, password }) {
    if (!username?.trim()) throw new AppError("Username is required", 400);
    if (!password?.trim()) throw new AppError("Password is required", 400);

    const normalizedUsername = username.trim().toLowerCase();

    const record = await userRepository.findByUsername(normalizedUsername);
    if (!record) throw new AppError("Invalid credentials", 401);

    if (record.isBlocked) {
      throw new AppError("User is blocked", 403);
    }

    const valid = await bcrypt.compare(password, record.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401);

    await userRepository.updateLastLogin(record.id);

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
    if (!user) throw new AppError("User not found", 404);

    if (user.isBlocked) {
      await userRepository.deleteRefreshToken(refreshToken);
      throw new AppError("User is blocked", 403);
    }

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

// Helpers

async function buildAuthResponse(user) {
  const accessToken = tokenService.generateAccessToken({ sub: user.id });
  const refreshToken = tokenService.generateRefreshToken();
  const expiresAt = tokenService.refreshTokenExpiresAt();

  await userRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

  return {
    user: formatUser(user),
    tokens: {
      accessToken,
      refreshToken,
      refreshExpiresAt: expiresAt.toISOString(),
    },
  };
}

function formatUser(user) {
  return {
    id: user.id,
    username: user.username,
    role: user.role ?? null,
    companyName: user.company?.name ?? null,
    isBlocked: user.isBlocked ?? false,
  };
}