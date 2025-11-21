import { Router } from "express";
import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { requireFeature } from "../../middlewares/feature.middleware.js";
import * as reportController from "./reports.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as reportValidation from "./reports.validation.js";

const router = Router();

// --- Reports for Manager & Admin ---

// Sales Reports
router.get(
  "/sales-summary",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.salesReportSchema),
  reportController.getSalesSummaryReport
);

router.get(
  "/item-wise-sales",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.salesReportSchema),
  reportController.getItemWiseSalesReport
);

router.get(
  "/category-sales",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getCategorySalesReport
);

// Inventory Reports
router.get(
  "/stock-level",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  reportController.getStockLevelReport
);

// Financial & Operational Reports
router.get(
  "/daily-closing",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.singleDateSchema),
  reportController.getDailyClosingReport
);

router.get(
  "/order-cancellation",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getOrderCancellationReport
);

router.get(
  "/payment-summary",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getPaymentSummaryReport
);

// --- Reports for Admin Only ---

// Inventory Reports
router.get(
  "/stock-consumption",
  authenticateJWT,
  authorizeRoles("ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getStockConsumptionReport
);

// ===== NEW REPORTS =====

// Inventory Variance / Wastage Report
router.get(
  "/inventory-variance",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getInventoryVarianceReport
);

// Costing & Profitability Report
router.get(
  "/menu-item-profitability",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.salesReportSchema),
  reportController.getMenuItemProfitabilityReport
);

// Sales by Hour / Heatmap Report
router.get(
  "/sales-by-hour",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getSalesByHourReport
);

// Tax Compliance Report (GST/VAT)
router.get(
  "/tax-compliance",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getTaxComplianceReport
);

// Sales by Employee Report (Staff Performance)
router.get(
  "/sales-by-employee",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.salesReportSchema),
  reportController.getSalesByEmployeeReport
);

// Discount & Promotion Analysis Report
router.get(
  "/discount-analysis",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getDiscountAnalysisReport
);

// Profit & Loss Report (includes Operational Expenses)
router.get(
  "/profit-and-loss",
  authenticateJWT,
  authorizeRoles("MANAGER", "ADMIN"),
  requireFeature("reports"),
  validate(reportValidation.dateRangeSchema),
  reportController.getProfitAndLossReport
);

export default router;
