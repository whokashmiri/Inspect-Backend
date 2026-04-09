// auth.middleware.js
import { tokenService } from "../../application/auth/token.service.js";
import { AppError } from "../../utils/AppError.js";

export function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new AppError("Unauthorized", 401);

  const token = header.slice(7);

  try {
    const payload = tokenService.verifyAccessToken(token);
    req.userId = payload.sub;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }
}
