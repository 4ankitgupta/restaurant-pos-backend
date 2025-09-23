import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createOrderSchema,
  addItemsToOrderSchema,
  updateOrderStatusSchema,
} from "./order.validation.js";
import {
  createOrderController,
  addItemsToOrderController,
  getOrderDetailsController,
  updateOrderStatusController,
} from "./order.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  validate(createOrderSchema),
  createOrderController
);

router.post(
  "/:orderId/items",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER),
  validate(addItemsToOrderSchema),
  addItemsToOrderController
);

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

router.patch(
  "/:orderId/status",
  authenticateJWT,
  authorizeRoles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.KITCHEN_STAFF,
    UserRole.CASHIER
  ),
  validate(updateOrderStatusSchema),
  updateOrderStatusController
);

export default router;
