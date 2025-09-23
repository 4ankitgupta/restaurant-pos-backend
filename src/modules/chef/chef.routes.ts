// src/modules/chef/chef.routes.ts

import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { updateOrderStatusSchema } from "./chef.validation.js";
import {
  getPreparingOrdersController,
  updateOrderStatusController,
} from "./chef.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

// Route for the chef to get all orders that are currently "PREPARING"
router.get(
  "/orders/preparing",
  authenticateJWT,
  authorizeRoles(UserRole.KITCHEN_STAFF, UserRole.ADMIN),
  getPreparingOrdersController
);

// Route for the chef to update the status of an order (e.g., to "PREPARED")
router.patch(
  "/orders/:orderId/status",
  authenticateJWT,
  authorizeRoles(UserRole.KITCHEN_STAFF, UserRole.ADMIN),
  validate(updateOrderStatusSchema),
  updateOrderStatusController
);

export default router;
