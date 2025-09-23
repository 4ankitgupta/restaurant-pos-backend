import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createOrderSchema,
  addItemsToOrderSchema,
} from "./order.validation.js";
import {
  createOrderController,
  addItemsToOrderController,
  getOrderDetailsController,
} from "./order.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

// Route to create a new order
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.CASHIER),
  validate(createOrderSchema),
  createOrderController
);

// Route to add items to an existing order
router.post(
  "/:orderId/items",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.CASHIER),
  validate(addItemsToOrderSchema),
  addItemsToOrderController
);

router.get(
  "/:orderId",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.CASHIER, UserRole.ADMIN),
  getOrderDetailsController
);

export default router;
