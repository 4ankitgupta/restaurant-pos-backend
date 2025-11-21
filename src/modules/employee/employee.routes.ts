import { Router } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { requireFeature } from "../../middlewares/feature.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from "./employee.validation.js";
import {
  createEmployeeController,
  getAllEmployeesController,
  updateEmployeeController,
  deleteEmployeeController,
} from "./employee.controller.js";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

const router = Router();

// All employee routes are for Admins and Managers
router.use(
  authenticateJWT,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  requireFeature("attendance")
);

router
  .route("/")
  .get(getAllEmployeesController)
  .post(
    enforceTenancy,
    validate(createEmployeeSchema),
    createEmployeeController
  );

router
  .route("/:id")
  .patch(validate(updateEmployeeSchema), updateEmployeeController)
  .delete(deleteEmployeeController);

export default router;
