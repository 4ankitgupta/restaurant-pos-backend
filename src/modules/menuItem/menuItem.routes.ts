import { Router } from "express";
import { MenuItemController } from "./menuItem.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";
import { menuItemValidation } from "./menuItem.validation.js"; // Import the validation rules
import { UserRole } from "@prisma/client";

const router = Router();
const menuItemController = new MenuItemController();

router.get(
  "/",
  authenticateJWT,
  menuItemController.getAllMenuItems.bind(menuItemController)
);

router.post(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  enforceTenancy,
  menuItemValidation, // Add validation middleware
  menuItemController.createMenuItem.bind(menuItemController)
);

router.get(
  "/:id",
  authenticateJWT,
  menuItemController.getMenuItemById.bind(menuItemController)
);

router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  menuItemValidation, // Add validation middleware
  menuItemController.updateMenuItem.bind(menuItemController)
);

router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  menuItemController.deleteMenuItem.bind(menuItemController)
);

router.post(
  "/reorder",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  menuItemController.reorderMenuItems.bind(menuItemController)
);

export default router;
