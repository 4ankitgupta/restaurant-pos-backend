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

const router = Router();

router.post(
  "/orders",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  validate(createOrderSchema),
  createOrderController
);

router.post(
  "/orders/:orderId/items",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  validate(addItemsToOrderSchema),
  addItemsToOrderController
);

router.patch(
  "/order-items/:orderItemId/status",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  validate(updateOrderItemStatusSchema),
  updateOrderItemStatusController
);

router.patch(
  "/orders/:orderId/complete",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  validate(completeOrderSchema),
  completeOrderController
);

export default router;
