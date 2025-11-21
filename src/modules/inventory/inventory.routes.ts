import { Router } from "express";
import {
  createInventoryItemController,
  deleteInventoryItemController,
  getAllInventoryItemsController,
  updateInventoryItemController,
  getInventoryItemByIdController,
  adjustStockController,
} from "./inventory.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { requireFeature } from "../../middlewares/feature.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
  adjustStockSchema,
} from "./inventory.validation.js";

const router = Router();

router.use(
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  requireFeature("inventory_management")
);

router
  .route("/")
  .get(getAllInventoryItemsController)
  .post(validate(createInventoryItemSchema), createInventoryItemController);

router
  .route("/:id")
  .get(getInventoryItemByIdController)
  .patch(validate(updateInventoryItemSchema), updateInventoryItemController)
  .delete(deleteInventoryItemController);

router
  .route("/:id/adjust-stock")
  .post(validate(adjustStockSchema), adjustStockController);

export default router;
