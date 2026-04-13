// auth.service.js - Handles user authentication, including signup, login, token refresh, and logout.

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";
import { companyRepository } from "../../infrastructure/repositories/company.repo.js";
import { tokenService } from "./token.service.js";
import { AppError } from "../../utils/AppError.js";

export const authService = {
  async signup({ email, password, fullName, role, companyName }) {
    console.log("SIGNUP INPUT:", { email, fullName, role, companyName });

    if (!email?.trim()) throw new AppError("Email is required", 400);
    if (!password?.trim()) throw new AppError("Password is required", 400);
    if (!fullName?.trim()) throw new AppError("Full name is required", 400);
    if (!role?.trim()) throw new AppError("Role is required", 400);
    if (!companyName?.trim()) throw new AppError("Company name is required", 400);

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = fullName.trim();
    const normalizedRole = role.trim();
    const normalizedCompanyName = companyName.trim().toUpperCase();

    const existing = await userRepository.findByEmail(normalizedEmail);
    if (existing) throw new AppError("Email already in use", 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      let company = await companyRepository.findByName(normalizedCompanyName, {
        session,
      });

      if (!company) {
        company = await companyRepository.create(
          { name: normalizedCompanyName },
          { session }
        );
      }

      if (normalizedRole === "Manager") {
        const existingManager = await userRepository.findManagerByCompanyId(
          company.id,
          { session }
        );

        if (existingManager) {
          throw new AppError(
            `Company ${normalizedCompanyName} already has a manager`,
            409
          );
        }
      }

      const user = await userRepository.create(
        {
          email: normalizedEmail,
          fullName: normalizedFullName,
          role: normalizedRole,
          passwordHash,
          companyId: company.id,
        },
        { session }
      );

      await session.commitTransaction();
      return buildAuthResponse(user);
    } catch (error) {
      await session.abortTransaction();

      if (error?.code === 11000) {
        const target = Array.isArray(error.keyPattern)
          ? error.keyPattern[0]
          : Object.keys(error.keyPattern || {})[0];
        if (target === "email") {
          throw new AppError("Email already in use", 409);
        }
        if (target === "name") {
          throw new AppError("Company already exists", 409);
        }
      }

      if (error instanceof AppError) throw error;
      throw error;
    } finally {
      session.endSession();
    }
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
    email: user.email,
    fullName: user.fullName ?? null,
    role: user.role ?? null,
    companyName: user.company?.name ?? null,
  };
}
