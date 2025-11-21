import { Router } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { requireFeature } from "../../middlewares/feature.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPunchSchema, getReportSchema } from "./attendance.validation.js";
import {
  createPunchController,
  getDailyReportController,
} from "./attendance.controller.js";

const router = Router();

// These routes are for Admins and Managers
router.use(
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  requireFeature("attendance")
);

/**
 * POST /api/v1/attendance/punch
 */
router.post("/punch", validate(createPunchSchema), createPunchController);

/**
 * GET /api/v1/attendance/report
 */
router.get("/report", validate(getReportSchema), getDailyReportController);

export default router;
