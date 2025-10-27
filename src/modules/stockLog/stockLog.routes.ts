import { Router } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import { createStockLogSchema } from "./stockLog.validation.js";
import { createStockLogController } from "./stockLog.controller.js";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

const router = Router();

router.use(authenticateJWT, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER));

router.post(
  "/",
  enforceTenancy,
  validate(createStockLogSchema),
  createStockLogController
);

export default router;
