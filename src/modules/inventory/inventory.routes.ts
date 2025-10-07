import { Router } from "express";
import {
  createInventoryItemController,
  deleteInventoryItemController,
  getAllInventoryItemsController,
  updateInventoryItemController,
  getInventoryItemByIdController,
} from "./inventory.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createInventoryItemSchema,
  updateInventoryItemSchema,
} from "./inventory.validation.js";

const router = Router();

router.use(authenticateJWT, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER));

router
  .route("/")
  .get(getAllInventoryItemsController)
  .post(validate(createInventoryItemSchema), createInventoryItemController);

router
  .route("/:id")
  .get(getInventoryItemByIdController)
  .patch(validate(updateInventoryItemSchema), updateInventoryItemController)
  .delete(deleteInventoryItemController);

export default router;
