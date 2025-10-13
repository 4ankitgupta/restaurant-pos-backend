import { Router } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import {
  getAdminDashboardData,
  getManagerDashboardData,
} from "./dashboard.controller.js";

const router = Router();

// Manager Dashboard Route (Accessible by Manager and Admin)
router
  .route("/manager")
  .get(
    authenticateJWT,
    authorizeRoles("MANAGER", "ADMIN"),
    getManagerDashboardData
  );

// Admin Dashboard Route (Accessible by Admin only)
router
  .route("/admin")
  .get(authenticateJWT, authorizeRoles("ADMIN"), getAdminDashboardData);

export default router;
