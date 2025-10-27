import { Router } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  addItemsToOrderSchema,
  createTakeawayOrderSchema,
} from "./cashier.validation.js";
import {
  getActiveAndUnpaidOrdersController,
  getCompletedOrdersController,
  getOrderDetailsController,
  addItemsToOrderController,
  createTakeawayOrderController,
} from "./cashier.controller.js";
import { createPaymentController } from "../payment/payment.controller.js";
import { createPaymentSchema } from "../payment/payment.validation.js";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

const router = Router();

router.use(
  authenticateJWT,
  authorizeRoles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
);

router.get("/orders", getActiveAndUnpaidOrdersController);
router.get("/orders/completed", getCompletedOrdersController);
router.get("/orders/:orderId", getOrderDetailsController);
router.post(
  "/orders/:orderId/items",
  enforceTenancy,
  validate(addItemsToOrderSchema),
  addItemsToOrderController
);
router.post(
  "/orders/takeaway",
  enforceTenancy,
  validate(createTakeawayOrderSchema),
  createTakeawayOrderController
);
router.post(
  "/payment",
  enforceTenancy,
  validate(createPaymentSchema),
  createPaymentController
);
router.post("/orders/:orderId/refund", enforceTenancy, createPaymentController);

export default router;
