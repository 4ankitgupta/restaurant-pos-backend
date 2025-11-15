import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createOrderSchema,
  addItemsToOrderSchema,
  updateOrderItemStatusSchema,
  completeOrderSchema,
} from "./waiter.validation.js";
import {
  createOrderController,
  addItemsToOrderController,
  updateOrderItemStatusController,
  completeOrderController,
} from "./waiter.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

const router = Router();

router.post(
  "/orders",
  authenticateJWT,
  enforceTenancy,
  authorizeRoles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.ADMIN
  ), // Cashier added
  validate(createOrderSchema),
  createOrderController
);

router.post(
  "/orders/:orderId/items",
  authenticateJWT,
  enforceTenancy,
  authorizeRoles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.ADMIN
  ), // Cashier added
  validate(addItemsToOrderSchema),
  addItemsToOrderController
);

router.patch(
  "/order-items/:orderItemId/status",
  authenticateJWT,
  authorizeRoles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.ADMIN
  ), // Cashier added (optional, but good for control)
  validate(updateOrderItemStatusSchema),
  updateOrderItemStatusController
);

router.patch(
  "/orders/:orderId/complete",
  authenticateJWT,
  authorizeRoles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.ADMIN
  ), // Cashier added
  validate(completeOrderSchema),
  completeOrderController
);

export default router;
