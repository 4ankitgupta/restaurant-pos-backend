import { Router } from "express";
import { MenuController } from "./menu.controller.js";

const router = Router();
const menuController = new MenuController();

// Correctly map routes to the existing controller methods
router.get("/", menuController.getAllMenus);
router.post("/", menuController.createMenu);
router.get("/:id", menuController.getMenuById); // Added this route
router.put("/:id", menuController.updateMenu);
router.delete("/:id", menuController.deleteMenu);

export default router;
