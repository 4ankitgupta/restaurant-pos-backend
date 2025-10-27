import { Router } from "express";
import { MenuItemController } from "./menuItem.controller.js";
import { authenticateJWT } from "../../middlewares/auth.middleware.js";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

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
  enforceTenancy,
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
  menuItemController.updateMenuItem.bind(menuItemController)
);
router.delete(
  "/:id",
  authenticateJWT,
  menuItemController.deleteMenuItem.bind(menuItemController)
);

export default router;
