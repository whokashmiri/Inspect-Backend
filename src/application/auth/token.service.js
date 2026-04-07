import jwt from "jsonwebtoken";
import crypto from "crypto";

const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } = process.env;

export const tokenService = {
  generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
  },

  verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
  },

  refreshTokenExpiresAt() {
    const ms = parseDuration(JWT_REFRESH_EXPIRES_IN);
    return new Date(Date.now() + ms);
  },
};

function parseDuration(str) {
  const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${str}`);
  return parseInt(match[1]) * units[match[2]];
}
