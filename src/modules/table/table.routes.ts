import { Router } from "express";
import {
  getAllTablesController,
  seatTableController, // Renamed from allocate
  updateTableStatusController,
} from "./table.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { getActiveOrderByTableController } from "../order/order.controller.js"; // Import from order controller

const router = Router();

router.get("/", authenticateJWT, getAllTablesController);

router.post(
  "/:tableId/seat", // Changed from /allocate
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  seatTableController
);

router.patch(
  "/:tableId/status",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  updateTableStatusController
);

// --- NEW ---
router.get(
  "/:tableId/active-order",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER, UserRole.CASHIER),
  getActiveOrderByTableController
);

export default router;
