import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { registerSchema, loginSchema } from "./auth.validation.js";
import { registerUserController, loginController } from "./auth.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

// @route   POST /api/v1/auth/register
// @desc    Register a new staff member
// @access  Private (Admin, Manager)
router.post(
  "/register",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate(registerSchema),
  registerUserController
);

// @route   POST /api/v1/auth/login
// @desc    Login user and get tokens
// @access  Public
router.post("/login", validate(loginSchema), loginController);

export default router;
