import { Router } from "express";
import {
  getAllTablesController,
  createTableController,
  updateTableController,
  deleteTableController,
  seatTableController, // Renamed from allocate
  updateTableStatusController,
} from "./table.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { getActiveOrderByTableController } from "../order/order.controller.js"; // Import from order controller
import { validate } from "../../middlewares/validate.middleware.js";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";
import {
  createTableSchema,
  updateTableSchema,
  deleteTableSchema,
} from "./table.validation.js";

const router = Router();

router.use(authenticateJWT);

router
  .route("/")
  .get(getAllTablesController)
  .post(
    authorizeRoles(UserRole.MANAGER, UserRole.ADMIN),
    enforceTenancy,
    validate(createTableSchema),
    createTableController
  );

router
  .route("/:tableId")
  .patch(
    authorizeRoles(UserRole.MANAGER, UserRole.ADMIN),
    validate(updateTableSchema),
    updateTableController
  )
  .delete(
    authorizeRoles(UserRole.MANAGER, UserRole.ADMIN),
    validate(deleteTableSchema),
    deleteTableController
  );

router.post(
  "/:tableId/seat", // Changed from /allocate
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN),
  enforceTenancy,
  seatTableController
);

router.patch(
  "/:tableId/status",
  authorizeRoles(UserRole.WAITER, UserRole.MANAGER, UserRole.ADMIN),
  updateTableStatusController
);

// --- NEW ---
router.get(
  "/:tableId/active-order",
  authorizeRoles(
    UserRole.WAITER,
    UserRole.MANAGER,
    UserRole.CASHIER,
    UserRole.ADMIN
  ),
  getActiveOrderByTableController
);

export default router;
