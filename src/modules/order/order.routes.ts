import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { addItemsToOrderSchema } from "./order.validation.js"; // Renamed
import { addItemsToOrderController } from "./order.controller.js"; // Renamed
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

// This route now adds items to an existing order
router.post(
  "/:orderId/items",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.CASHIER),
  validate(addItemsToOrderSchema),
  addItemsToOrderController
);

export default router;
