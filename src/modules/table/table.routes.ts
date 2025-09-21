import { Router } from "express";
import {
  getAllTablesController,
  allocateTableController,
  updateTableStatusController,
} from "./table.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.get("/", authenticateJWT, getAllTablesController);

router.post(
  "/:tableId/allocate",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  allocateTableController
);

router.patch(
  "/:tableId/status",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  updateTableStatusController
);

export default router;
