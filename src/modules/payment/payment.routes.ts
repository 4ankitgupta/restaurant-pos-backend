import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPaymentSchema } from "./payment.validation.js";
import { createPaymentController } from "./payment.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.CASHIER),
  validate(createPaymentSchema),
  createPaymentController
);

export default router;
