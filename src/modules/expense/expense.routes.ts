import { Router } from "express";
import {
  // Category controllers
  getAllExpenseCategoriesController,
  getExpenseCategoryByIdController,
  createExpenseCategoryController,
  updateExpenseCategoryController,
  deleteExpenseCategoryController,
  // Expense controllers
  getAllExpensesController,
  getExpenseByIdController,
  createExpenseController,
  updateExpenseController,
  deleteExpenseController,
  // Recurring expense controllers
  getAllRecurringExpensesController,
  getRecurringExpenseByIdController,
  createRecurringExpenseController,
  updateRecurringExpenseController,
  deleteRecurringExpenseController,
  // Analytics
  getExpenseAnalyticsController,
} from "./expense.controller.js";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { UserRole } from "@prisma/client";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createExpenseCategorySchema,
  updateExpenseCategorySchema,
  createExpenseSchema,
  updateExpenseSchema,
  createRecurringExpenseSchema,
  updateRecurringExpenseSchema,
  getExpensesQuerySchema,
} from "./expense.validation.js";

const router = Router();

// Apply authentication and authorization to all routes
router.use(authenticateJWT, authorizeRoles(UserRole.ADMIN, UserRole.MANAGER));

// ================ ANALYTICS ROUTES ================
router.get("/analytics", getExpenseAnalyticsController);

// ================ CATEGORY ROUTES ================
router
  .route("/categories")
  .get(getAllExpenseCategoriesController)
  .post(validate(createExpenseCategorySchema), createExpenseCategoryController);

router
  .route("/categories/:id")
  .get(getExpenseCategoryByIdController)
  .patch(validate(updateExpenseCategorySchema), updateExpenseCategoryController)
  .delete(deleteExpenseCategoryController);

// ================ RECURRING EXPENSE ROUTES ================
router
  .route("/recurring")
  .get(getAllRecurringExpensesController)
  .post(
    validate(createRecurringExpenseSchema),
    createRecurringExpenseController
  );

router
  .route("/recurring/:id")
  .get(getRecurringExpenseByIdController)
  .patch(
    validate(updateRecurringExpenseSchema),
    updateRecurringExpenseController
  )
  .delete(deleteRecurringExpenseController);

// ================ EXPENSE ROUTES ================
router
  .route("/")
  .get(validate(getExpensesQuerySchema), getAllExpensesController)
  .post(validate(createExpenseSchema), createExpenseController);

router
  .route("/:id")
  .get(getExpenseByIdController)
  .patch(validate(updateExpenseSchema), updateExpenseController)
  .delete(deleteExpenseController);

export default router;
