import { Router } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createSupplierSchema,
  updateSupplierSchema,
} from "./supplier.validation.js";
import {
  createSupplierController,
  deleteSupplierController,
  getAllSuppliersController,
  getSupplierByIdController,
  updateSupplierController,
} from "./supplier.controller.js";

const router = Router();

// All supplier routes are protected for Admins and Managers
router.use(authenticateJWT, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER));

router
  .route("/")
  .get(getAllSuppliersController)
  .post(validate(createSupplierSchema), createSupplierController);

router
  .route("/:id")
  .get(getSupplierByIdController)
  .patch(validate(updateSupplierSchema), updateSupplierController)
  .delete(deleteSupplierController);

export default router;
