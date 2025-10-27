import { Router } from "express";
import { UserController } from "./users.controller.js";
import { authenticateJWT } from "../../middlewares/auth.middleware.js";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

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
  userController.updateUser.bind(userController)
);
router.delete(
  "/:id",
  authenticateJWT,
  userController.deleteUser.bind(userController)
);

export default router;
