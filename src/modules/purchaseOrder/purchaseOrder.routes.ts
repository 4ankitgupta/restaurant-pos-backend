import { Router } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { requireFeature } from "../../middlewares/feature.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import { createPurchaseOrderSchema } from "./purchaseOrder.validation.js";
import {
  createPurchaseOrderController,
  getAllPurchaseOrdersController,
} from "./purchaseOrder.controller.js";

const router = Router();

router.use(
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  requireFeature("inventory_management")
);

router
  .route("/")
  .get(getAllPurchaseOrdersController)
  .post(validate(createPurchaseOrderSchema), createPurchaseOrderController);

export default router;
