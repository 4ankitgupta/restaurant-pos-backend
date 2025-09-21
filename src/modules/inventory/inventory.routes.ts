import { Router } from "express";
import { getAllInventoryItemsController } from "./inventory.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  getAllInventoryItemsController
);

export default router;
