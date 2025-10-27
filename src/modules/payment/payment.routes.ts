import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createPaymentSchema,
  refundPaymentSchema,
} from "./payment.validation.js";
import {
  createPaymentController,
  refundPaymentController,
} from "./payment.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  enforceTenancy,
  validate(createPaymentSchema),
  createPaymentController
);

router.post(
  "/:orderId/refund",
  authenticateJWT,
  authorizeRoles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN),
  enforceTenancy,
  validate(refundPaymentSchema),
  refundPaymentController
);

export default router;
