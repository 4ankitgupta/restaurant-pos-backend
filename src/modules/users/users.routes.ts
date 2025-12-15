import { Router } from "express";
import { UserController } from "./users.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { changePasswordSchema } from "./users.validation.js";
import { UserRole } from "@prisma/client";

const router = Router();
const userController = new UserController();

router.get(
  "/",
  authenticateJWT,
  userController.getAllUsers.bind(userController)
);
router.post(
  "/",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  enforceTenancy,
  userController.createUser.bind(userController)
);
router.get(
  "/:id",
  authenticateJWT,
  userController.getUserById.bind(userController)
);
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  userController.updateUser.bind(userController)
);
router.patch(
  "/:id/change-password",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN),
  validate(changePasswordSchema),
  userController.changePassword.bind(userController)
);
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  userController.deleteUser.bind(userController)
);

export default router;
