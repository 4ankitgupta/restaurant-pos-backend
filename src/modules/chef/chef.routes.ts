// src/modules/chef/chef.routes.ts

import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { updateOrderItemStatusSchema } from "./chef.validation.js";
import {
  getPreparingOrdersController,
  updateOrderItemStatusController,
} from "./chef.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

// Route for the chef to get all orders that have at least one item in 'PREPARING'
router.get(
  "/orders/preparing",
  authenticateJWT,
  authorizeRoles(UserRole.KITCHEN_STAFF, UserRole.ADMIN),
  getPreparingOrdersController
);

// Route for the chef to update the status of an order item (e.g., to "PREPARED")
router.patch(
  "/order-items/:orderItemId/status",
  authenticateJWT,
  authorizeRoles(UserRole.KITCHEN_STAFF, UserRole.ADMIN),
  validate(updateOrderItemStatusSchema),
  updateOrderItemStatusController
);

export default router;
