import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
} from "./auth.validation.js";
import {
  registerUserController,
  loginController,
  updateUserController,
  deleteUserController,
} from "./auth.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

const router = Router();

// @route   POST /api/v1/auth/register
// @desc    Register a new staff member
// @access  Private (Admin, Manager)
router.post(
  "/register",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  enforceTenancy,
  validate(registerSchema),
  registerUserController
);

// @route   POST /api/v1/auth/login
// @desc    Login user and get tokens
// @access  Public
router.post("/login", validate(loginSchema), loginController);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate(updateUserSchema),
  updateUserController
);

// @route   DELETE /api/v1/auth/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN),
  deleteUserController
);

export default router;
