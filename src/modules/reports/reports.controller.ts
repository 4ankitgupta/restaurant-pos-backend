import type { Response } from "express";
import httpStatus from "http-status";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import * as reportService from "./reports.service.js";
import { type AuthRequest } from "../../middlewares/auth.middleware.js";

const handleReportRequest = (
  serviceFunction: (restaurantId: string, query: any) => Promise<any>
) =>
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const restaurantId = req.user!.restaurantId;
    const data = await serviceFunction(restaurantId, req.query);
    res
      .status(httpStatus.OK)
      .json(
        new ApiResponse(httpStatus.OK, data, "Report generated successfully")
      );
  });

// Sales
export const getSalesSummaryReport = handleReportRequest(
  reportService.generateSalesSummaryReport
);
export const getItemWiseSalesReport = handleReportRequest(
  reportService.generateItemWiseSalesReport
);
export const getCategorySalesReport = handleReportRequest(
  reportService.generateCategorySalesReport
);

// Inventory
export const getStockLevelReport = handleReportRequest(
  reportService.generateStockLevelReport
);
export const getStockConsumptionReport = handleReportRequest(
  reportService.generateStockConsumptionReport
);

// Financial & Operational
export const getDailyClosingReport = handleReportRequest(
  reportService.generateDailyClosingReport
);
export const getOrderCancellationReport = handleReportRequest(
  reportService.generateOrderCancellationReport
);
export const getPaymentSummaryReport = handleReportRequest(
  reportService.generatePaymentSummaryReport
);

// ===== NEW REPORTS =====
export const getInventoryVarianceReport = handleReportRequest(
  reportService.generateInventoryVarianceReport
);
export const getMenuItemProfitabilityReport = handleReportRequest(
  reportService.generateMenuItemProfitabilityReport
);
export const getSalesByHourReport = handleReportRequest(
  reportService.generateSalesByHourReport
);
export const getTaxComplianceReport = handleReportRequest(
  reportService.generateTaxComplianceReport
);
export const getSalesByEmployeeReport = handleReportRequest(
  reportService.generateSalesByEmployeeReport
);
export const getDiscountAnalysisReport = handleReportRequest(
  reportService.generateDiscountAnalysisReport
);
export const getProfitAndLossReport = handleReportRequest(
  reportService.generateProfitAndLossReport
);
