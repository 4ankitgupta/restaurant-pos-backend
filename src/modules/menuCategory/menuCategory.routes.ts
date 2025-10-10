import { Router } from "express";
import {
  getAllMenuCategoriesController,
  createMenuCategoryController,
  updateMenuCategoryController,
  deleteMenuCategoryController,
} from "./menuCategory.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.get("/", authenticateJWT, getAllMenuCategoriesController);
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  createMenuCategoryController
);
router.patch(
  "/:categoryId",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  updateMenuCategoryController
);
router.delete(
  "/:categoryId",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  deleteMenuCategoryController
);

export default router;
