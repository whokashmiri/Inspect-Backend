import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userRepository } from "../../infrastructure/repositories/user.repo.js";

import { tokenService } from "./token.service.js";
import { AppError } from "../../utils/AppError.js";
import {
  sendAuthenticaOtp,
  verifyAuthenticaOtp,
} from "../../infrastructure/authentica.sms.js";

const OTP_EXPIRES_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;

export const authService = {
  async requestSignupOtp({ phone }) {
  const normalizedPhone = normalizeSaudiPhone(phone);

  const existingUser = await userRepository.findByPhone(normalizedPhone);
  if (existingUser) {
    throw new AppError("Phone number is already registered", 409);
  }

  await sendAuthenticaOtp({
    phone: normalizedPhone,
    templateId: process.env.AUTHENTICA_TEMPLATE_ID || 5,
  });

  return {
    success: true,
    message: "OTP sent successfully",
    phone: normalizedPhone,
  };
},

async verifySignupOtp({ phone, otp }) {
  const normalizedPhone = normalizeSaudiPhone(phone);

  if (!otp?.trim()) {
    throw new AppError("OTP is required", 400);
  }

  const result = await verifyAuthenticaOtp({
    phone: normalizedPhone,
    otp: otp.trim(),
  });

  if (!result.success) {
    throw new AppError("Invalid OTP", 400);
  }

  const setupToken = jwt.sign(
    {
      phone: normalizedPhone,
      purpose: "set-password",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  return {
    success: true,
    message: "OTP verified successfully",
    setupToken,
  };
},

  async setSignupPassword({ setupToken, password, role = "Inspector" }) {
    if (!setupToken) {
      throw new AppError("Setup token is required", 400);
    }

    if (!password || password.length < 6) {
      throw new AppError("Password must be at least 6 characters", 400);
    }

    let payload;

    try {
      payload = jwt.verify(setupToken, process.env.JWT_SECRET);
    } catch {
      throw new AppError("Invalid or expired setup token", 401);
    }

    if (payload.purpose !== "set-password") {
      throw new AppError("Invalid setup token", 401);
    }

    const phone = payload.phone;

    const existingUser = await userRepository.findByPhone(phone);
    if (existingUser) {
      throw new AppError("Phone number is already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await userRepository.create({
      phone,
      username: phone,
      usernameLower: phone.toLowerCase(),
      passwordHash,
      role,
      isPhoneVerified: true,
      isProfileCompleted: false,
      serviceCities: [],
    });

    return buildAuthResponse(user);
  },

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

  async completeProfile(userId, payload) {
  const user = await userRepository.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  const name = payload.name?.trim();
  const serviceCities = Array.isArray(payload.serviceCities)
    ? payload.serviceCities
    : [];

  if (!name) {
    throw new AppError("Name is required", 400);
  }

  if (serviceCities.length === 0) {
    throw new AppError("At least one service city is required", 400);
  }

  const updatedUser = await userRepository.updateProfile(userId, {
    name,
    serviceCities,
    isProfileCompleted: true,
  });

  return formatUser(updatedUser);
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




function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeSaudiPhone(phone) {
  if (!phone?.trim()) {
    throw new AppError("Phone number is required", 400);
  }

  let value = phone.trim().replace(/\s+/g, "");

  if (value.startsWith("05")) {
    value = "+966" + value.slice(1);
  } else if (value.startsWith("5")) {
    value = "+966" + value;
  } else if (value.startsWith("966")) {
    value = "+" + value;
  }

  const valid = /^\+9665\d{8}$/.test(value);

  if (!valid) {
    throw new AppError("Invalid Saudi phone number", 400);
  }

  return value;
}

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
    phone: user.phone ?? null,
    name: user.name ?? null,
    role: user.role ?? null,
    companyName: user.company?.name ?? null,
    serviceCities: user.serviceCities ?? [],
    isProfileCompleted: user.isProfileCompleted ?? false,
    isPhoneVerified: user.isPhoneVerified ?? false,
    isBlocked: user.isBlocked ?? false,
  };
}