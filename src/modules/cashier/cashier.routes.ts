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
  validate(addItemsToOrderSchema),
  addItemsToOrderController
);
router.post(
  "/orders/takeaway",
  validate(createTakeawayOrderSchema),
  createTakeawayOrderController
);
router.post("/payment", validate(createPaymentSchema), createPaymentController);
router.post("/orders/:orderId/refund", createPaymentController);

export default router;
