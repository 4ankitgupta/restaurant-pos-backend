import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { createOrderSchema } from "./order.validation.js";
import { createOrderController } from "./order.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.WAITER, UserRole.CASHIER),
  validate(createOrderSchema),
  createOrderController
);

export default router;
