import { Router } from "express";
import {
  getOrderDetailsController,
  getAllOrdersController,
  getActiveOrdersController,
} from "./order.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/:orderId",
  authenticateJWT,
  authorizeRoles(
    UserRole.WAITER,
    UserRole.CASHIER,
    UserRole.ADMIN,
    UserRole.MANAGER
  ),
  getOrderDetailsController
);

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
    UserRole.CASHIER,
    UserRole.ADMIN
  ),
  getAllOrdersController
);

router.get(
  "/active",
  authenticateJWT,
  authorizeRoles(UserRole.KITCHEN_STAFF, UserRole.ADMIN, UserRole.MANAGER),
  getActiveOrdersController
);

export default router;
