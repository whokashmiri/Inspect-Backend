import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  loginSchema,
  refreshSchema,

  requestSignupOtpSchema,
  verifySignupOtpSchema,
  setSignupPasswordSchema,
} from "../validators/auth.validators.js";

const router = Router();

// SIGNUP WITH OTP
router.post(
  "/signup/request-otp",
  validate(requestSignupOtpSchema),
  asyncWrap(authController.requestSignupOtp)
);

router.post(
  "/signup/verify-otp",
  validate(verifySignupOtpSchema),
  asyncWrap(authController.verifySignupOtp)
);

router.post(
  "/signup/set-password",
  validate(setSignupPasswordSchema),
  asyncWrap(authController.setSignupPassword)
);

// LOGIN
router.post(
  "/login",
  validate(loginSchema),
  asyncWrap(authController.login)
);

// REFRESH
router.post(
  "/refresh",
  validate(refreshSchema),
  asyncWrap(authController.refresh)
);

// AUTH USER
router.get(
  "/me",
  authenticate,
  asyncWrap(authController.me)
);

// LOGOUT
router.post(
  "/logout",
  authenticate,
  asyncWrap(authController.logout)
);

// COMPANIES
router.get(
  "/companies",
  authenticate,
  asyncWrap(authController.companies)
);

function asyncWrap(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

export default router;