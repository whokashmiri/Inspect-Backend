import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  // signupSchema,
  loginSchema,
  refreshSchema,
} from "../validators/auth.validators.js";

const router = Router();

// router.post("/signup", validate(signupSchema), asyncWrap(authController.signup));
router.post("/login", validate(loginSchema), asyncWrap(authController.login));
router.post(
  "/refresh",
  validate(refreshSchema),
  asyncWrap(authController.refresh),
);
router.get("/me", authenticate, asyncWrap(authController.me));
router.post("/logout", authenticate, asyncWrap(authController.logout));

function asyncWrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export default router;
