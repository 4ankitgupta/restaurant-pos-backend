import prisma from "../../db/index.js";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { PaymentStatus, OrderStatus, OrderItemStatus } from "@prisma/client";

// Common filter generation logic
const getCommonFilters = (restaurantId: string, query: any) => {
  const { startDate, endDate, userId, orderType } = query;
  const filters: any = {
    restaurantId,
    createdAt: {
      gte: startDate ? startOfDay(parseISO(startDate)) : undefined,
      lte: endDate ? endOfDay(parseISO(endDate)) : undefined,
    },
    userId: userId || undefined,
  };
  if (orderType === "TAKEAWAY") {
    filters.takeAway = true;
  } else if (orderType === "DINE_IN") {
    filters.takeAway = false;
  }
  // Clean up undefined date filters
  if (!filters.createdAt.gte) delete filters.createdAt.gte;
  if (!filters.createdAt.lte) delete filters.createdAt.lte;
  if (Object.keys(filters.createdAt).length === 0) delete filters.createdAt;

  return filters;
};

// 1. Sales Summary Report
export const generateSalesSummaryReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);
  filters.paymentStatus = PaymentStatus.PAID;

  const orders = await prisma.order.findMany({ where: filters });

  const totalSales = orders.reduce(
    (sum, order) => sum + order.totalAmount.toNumber(),
    0
  );
  const totalDiscount = orders.reduce(
    (sum, order) => sum + 0, // No discount tracking in current model
    0
  );
  // Assuming a simple tax calculation for now.
  const totalTax = orders.reduce(
    (sum, order) => sum + order.totalAmount.toNumber() * 0.05,
    0
  ); // Example 5% GST

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    summary: {
      totalSales,
      totalDiscount,
      totalTax, // Note: Your schema doesn't have a tax field on orders. This is an example.
      netSales: totalSales - totalDiscount,
      orderCount: orders.length,
    },
    orders,
  };
};

// 2. Item-wise Sales Report
export const generateItemWiseSalesReport = async (
  restaurantId: string,
  query: any
) => {
  const { categoryId } = query;
  const filters = getCommonFilters(restaurantId, query);

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        ...filters,
        paymentStatus: PaymentStatus.PAID,
      },
      // FIX: Updated where clause
      menuItemVariant: {
        menuItem: {
          categoryId: categoryId || undefined,
        },
      },
    },
    include: {
      // FIX: Updated include clause
      menuItemVariant: {
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  const itemSales = orderItems.reduce((acc, item) => {
    // FIX: Use menuItemVariant.menuItem.id or name as key
    const key = item.menuItemVariant?.menuItem?.id ?? "unknown";
    if (key === "unknown") return acc; // Skip items with no variant

    if (!acc[key]) {
      acc[key] = {
        // FIX: Updated paths
        itemName: item.menuItemVariant?.menuItem?.name ?? "Unknown Item",
        category:
          item.menuItemVariant?.menuItem?.category?.name ?? "Uncategorized",
        quantitySold: 0,
        totalValue: 0,
      };
    }
    acc[key].quantitySold += item.quantity;
    acc[key].totalValue += item.price.toNumber() * item.quantity;
    return acc;
  }, {} as Record<string, any>);

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    itemSales: Object.values(itemSales).sort(
      (a, b) => b.quantitySold - a.quantitySold
    ),
  };
};

// 3. Category Sales Report
export const generateCategorySalesReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);

  const categoriesWithSales = await prisma.menuCategory.findMany({
    where: { restaurantId },
    include: {
      menuItems: {
        include: {
          // FIX: Go through variants to get to orderItems
          variants: {
            include: {
              orderItems: {
                where: {
                  order: { ...filters, paymentStatus: PaymentStatus.PAID },
                },
              },
            },
          },
        },
      },
    },
  });

  const categorySales = categoriesWithSales
    .map((cat) => {
      // FIX: Add nested reduce to go through variants
      const { totalValue, quantitySold } = cat.menuItems.reduce(
        (acc, menuItem) => {
          const variantTotals = menuItem.variants.reduce(
            (variantAcc, variant) => {
              const itemTotals = variant.orderItems.reduce(
                (itemAcc, orderItem) => {
                  itemAcc.value +=
                    orderItem.price.toNumber() * orderItem.quantity;
                  itemAcc.qty += orderItem.quantity;
                  return itemAcc;
                },
                { value: 0, qty: 0 }
              );
              variantAcc.value += itemTotals.value;
              variantAcc.qty += itemTotals.qty;
              return variantAcc;
            },
            { value: 0, qty: 0 }
          );
          acc.totalValue += variantTotals.value;
          acc.quantitySold += variantTotals.qty;
          return acc;
        },
        { totalValue: 0, quantitySold: 0 }
      );

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        quantitySold,
        totalValue,
      };
    })
    .filter((cat) => cat.totalValue > 0)
    .sort((a, b) => b.totalValue - a.totalValue);

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    categorySales,
  };
};

// 4. Stock Level Report
export const generateStockLevelReport = async (
  restaurantId: string,
  query: any
) => {
  const items = await prisma.inventoryItem.findMany({
    where: { restaurantId },
    orderBy: { name: "asc" },
  });
  return {
    reportMeta: { generatedAt: new Date() },
    stockLevels: items,
  };
};

// 5. Stock Consumption Report (Admin Only)
export const generateStockConsumptionReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);
  delete filters.userId;
  delete filters.orderType;

  const stockLogs = await prisma.stockLog.findMany({
    where: {
      inventoryItem: { restaurantId },
      createdAt: filters.createdAt,
      // We only care about stock being used
      changeType: { in: ["WASTAGE", "USAGE", "ADJUST", "REMOVE", "ADD"] },
    },
    include: { inventoryItem: true },
    orderBy: { createdAt: "desc" },
  });

  const consumption = stockLogs.reduce((acc, log) => {
    const key = log.inventoryItemId;
    if (!acc[key]) {
      acc[key] = {
        itemName: log.inventoryItem.name,
        unit: log.inventoryItem.unit,
        totalConsumed: 0,
      };
    }
    acc[key].totalConsumed += log.quantity;
    return acc;
  }, {} as Record<string, any>);

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    consumptionData: Object.values(consumption),
  };
};

// 6. Daily Closing Report (Z-Report)
export const generateDailyClosingReport = async (
  restaurantId: string,
  query: any
) => {
  const { date } = query;
  const targetDate = date ? parseISO(date) : new Date();
  const filters = {
    restaurantId,
    createdAt: {
      gte: startOfDay(targetDate),
      lte: endOfDay(targetDate),
    },
  };

  const paidOrders = await prisma.order.findMany({
    where: { ...filters, paymentStatus: PaymentStatus.PAID },
    include: { payments: true },
  });

  const summary = generateSalesSummaryReport(restaurantId, {
    startDate: startOfDay(targetDate).toISOString(),
    endDate: endOfDay(targetDate).toISOString(),
  });

  const paymentSummary = generatePaymentSummaryReport(restaurantId, {
    startDate: startOfDay(targetDate).toISOString(),
    endDate: endOfDay(targetDate).toISOString(),
  });

  return {
    reportMeta: {
      date: targetDate.toISOString().split("T")[0],
      generatedAt: new Date(),
    },
    sales: (await summary).summary,
    payments: (await paymentSummary).paymentSummary,
  };
};

// 7. Order Cancellation Report
export const generateOrderCancellationReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);

  const cancelledOrders = await prisma.order.findMany({
    where: {
      ...filters,
      status: OrderStatus.CANCELLED,
    },
    include: { user: { select: { id: true, name: true } } },
  });

  const cancelledItems = await prisma.orderItem.findMany({
    where: {
      order: { ...filters },
      status: OrderItemStatus.CANCELLED,
    },
    include: {
      order: { include: { user: { select: { id: true, name: true } } } },
      // FIX: Updated include path
      menuItemVariant: {
        include: {
          menuItem: true,
        },
      },
    },
  });

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    cancelledOrders,
    cancelledItems,
  };
};

// 8. Payment Summary Report
export const generatePaymentSummaryReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);

  const payments = await prisma.payment.findMany({
    where: {
      order: {
        ...filters,
        paymentStatus: PaymentStatus.PAID,
      },
    },
  });

  const paymentSummary = payments.reduce((acc, payment) => {
    const method = payment.paymentMethod;
    acc[method] = (acc[method] || 0) + payment.amount.toNumber();
    return acc;
  }, {} as Record<string, number>);

  const totalCollected = payments.reduce(
    (sum, p) => sum + p.amount.toNumber(),
    0
  );

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    paymentSummary,
    totalCollected,
  };
};

// ===== NEW REPORTS =====

// 9. Inventory Variance / Wastage Report
export const generateInventoryVarianceReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);
  const { inventoryItemId } = query;

  // Get all paid orders in the date range
  const orders = await prisma.order.findMany({
    where: {
      ...filters,
      paymentStatus: PaymentStatus.PAID,
    },
    include: {
      orderItems: {
        include: {
          menuItemVariant: {
            include: {
              menuItem: true,
            },
          },
        },
      },
    },
  });

  // Get actual stock consumption from logs
  const stockLogs = await prisma.stockLog.findMany({
    where: {
      inventoryItem: { restaurantId },
      createdAt: filters.createdAt,
      changeType: { in: ["WASTAGE", "USAGE", "ADJUST", "REMOVE"] },
      ...(inventoryItemId && { inventoryItemId }),
    },
    include: { inventoryItem: true },
  });

  // Get current inventory items with their latest purchase prices
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: {
      restaurantId,
      ...(inventoryItemId && { id: inventoryItemId }),
    },
    include: {
      purchaseItems: {
        orderBy: { purchaseOrder: { purchaseDate: "desc" } },
        take: 1,
        include: { purchaseOrder: true },
      },
    },
  });

  // Calculate theoretical consumption (would need recipe data)
  // For now, we'll use a simplified approach
  const varianceData = inventoryItems.map((item) => {
    const actualConsumption =
      stockLogs
        .filter((log) => log.inventoryItemId === item.id)
        .reduce((sum, log) => sum + log.quantity, 0) || 0;

    // Theoretical consumption would be calculated from recipes
    // This is a placeholder - you'd need a Recipe model to properly calculate this
    const theoreticalConsumption = 0; // TODO: Calculate from recipes

    const varianceQuantity = actualConsumption - theoreticalConsumption;
    const latestPrice = item.purchaseItems[0]?.unitPrice || 0;
    const costOfVariance = varianceQuantity * latestPrice;

    return {
      itemId: item.id,
      itemName: item.name,
      unit: item.unit,
      theoreticalConsumption,
      actualConsumption,
      varianceQuantity,
      latestUnitPrice: latestPrice,
      costOfVariance,
    };
  });

  const sortedVariance = varianceData
    .filter((item) => Math.abs(item.costOfVariance) > 0)
    .sort((a, b) => Math.abs(b.costOfVariance) - Math.abs(a.costOfVariance));

  const totalVarianceCost = sortedVariance.reduce(
    (sum, item) => sum + Math.abs(item.costOfVariance),
    0
  );

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    summary: {
      totalVarianceCost,
      itemsWithVariance: sortedVariance.length,
      highVarianceItems: sortedVariance.filter(
        (item) =>
          Math.abs(item.varianceQuantity) > item.actualConsumption * 0.05
      ).length,
    },
    varianceData: sortedVariance,
  };
};

// 10. Costing & Profitability Report (Menu Item Profitability)
export const generateMenuItemProfitabilityReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);
  const { categoryId } = query;

  // Get all paid order items in the date range
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        ...filters,
        paymentStatus: PaymentStatus.PAID,
      },
      menuItemVariant: {
        menuItem: {
          categoryId: categoryId || undefined,
        },
      },
    },
    include: {
      menuItemVariant: {
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  // Calculate profitability per menu item
  const itemProfitability = orderItems.reduce((acc, item) => {
    const menuItem = item.menuItemVariant?.menuItem;
    if (!menuItem) return acc;

    const key = menuItem.id;
    const variantName = item.menuItemVariant?.name || "Default";
    const displayName = `${menuItem.name} (${variantName})`;

    if (!acc[key]) {
      acc[key] = {
        itemId: menuItem.id,
        itemName: displayName,
        categoryName: menuItem.category?.name || "Uncategorized",
        sellingPrice: item.price.toNumber(),
        // TODO: Calculate actual COGS from recipe/ingredients
        costOfGoodsSold: item.price.toNumber() * 0.3, // Placeholder: 30% of selling price
        quantitySold: 0,
        totalRevenue: 0,
      };
    }

    acc[key].quantitySold += item.quantity;
    acc[key].totalRevenue += item.price.toNumber() * item.quantity;

    return acc;
  }, {} as Record<string, any>);

  const profitabilityData = Object.values(itemProfitability).map(
    (item: any) => {
      const grossProfit = item.sellingPrice - item.costOfGoodsSold;
      const grossProfitMarginPercentage =
        (grossProfit / item.sellingPrice) * 100;
      const totalGrossProfit = grossProfit * item.quantitySold;

      return {
        ...item,
        grossProfit,
        grossProfitMarginPercentage: Number(
          grossProfitMarginPercentage.toFixed(2)
        ),
        totalGrossProfit,
      };
    }
  );

  const sortedByMargin = profitabilityData.sort(
    (a, b) => b.grossProfitMarginPercentage - a.grossProfitMarginPercentage
  );

  const totalRevenue = sortedByMargin.reduce(
    (sum, item) => sum + item.totalRevenue,
    0
  );
  const totalProfit = sortedByMargin.reduce(
    (sum, item) => sum + item.totalGrossProfit,
    0
  );
  const averageMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    summary: {
      totalRevenue,
      totalProfit,
      averageMargin: Number(averageMargin.toFixed(2)),
      itemsAnalyzed: sortedByMargin.length,
    },
    profitabilityData: sortedByMargin,
  };
};

// 11. Sales by Hour / Heatmap Report
export const generateSalesByHourReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);
  const { dayOfWeek } = query; // Optional: 0 = Sunday, 1 = Monday, etc.

  const orders = await prisma.order.findMany({
    where: {
      ...filters,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  // Group by hour
  const hourlyData: Record<number, any> = {};

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    const hour = orderDate.getHours();
    const day = orderDate.getDay();

    // Filter by day of week if specified
    if (dayOfWeek !== undefined && day !== parseInt(dayOfWeek)) {
      return;
    }

    if (!hourlyData[hour]) {
      hourlyData[hour] = {
        hour,
        hourLabel: `${hour.toString().padStart(2, "0")}:00`,
        totalOrders: 0,
        totalSalesValue: 0,
      };
    }

    hourlyData[hour].totalOrders += 1;
    hourlyData[hour].totalSalesValue += order.totalAmount.toNumber();
  });

  const salesByHour = Object.values(hourlyData)
    .map((data) => ({
      ...data,
      averageOrderValue:
        data.totalOrders > 0 ? data.totalSalesValue / data.totalOrders : 0,
    }))
    .sort((a, b) => a.hour - b.hour);

  const peakHour = salesByHour.reduce(
    (max, curr) => (curr.totalSalesValue > max.totalSalesValue ? curr : max),
    salesByHour[0] || { hourLabel: "N/A", totalSalesValue: 0 }
  );

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    summary: {
      peakHour: peakHour.hourLabel,
      peakHourSales: peakHour.totalSalesValue,
      totalHoursWithSales: salesByHour.length,
    },
    salesByHour,
  };
};

// 12. Tax Compliance Report (GST/VAT)
export const generateTaxComplianceReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);

  const orders = await prisma.order.findMany({
    where: {
      ...filters,
      paymentStatus: PaymentStatus.PAID,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dailyTaxData: Record<string, any> = {};

  orders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toISOString().split("T")[0];
    const orderAmount = order.totalAmount.toNumber();

    // Assuming 18% GST (9% CGST + 9% SGST)
    // In reality, you'd need to store tax rates per item
    const grossTaxableSales = orderAmount / 1.18; // Reverse calculate taxable amount
    const totalGST = orderAmount - grossTaxableSales;
    const cgst = totalGST / 2;
    const sgst = totalGST / 2;

    if (!dailyTaxData[dateKey]) {
      dailyTaxData[dateKey] = {
        date: dateKey,
        grossTaxableSales: 0,
        cgstCollected: 0,
        sgstCollected: 0,
        totalGST: 0,
        totalNetSales: 0,
        orderCount: 0,
      };
    }

    dailyTaxData[dateKey].grossTaxableSales += grossTaxableSales;
    dailyTaxData[dateKey].cgstCollected += cgst;
    dailyTaxData[dateKey].sgstCollected += sgst;
    dailyTaxData[dateKey].totalGST += totalGST;
    dailyTaxData[dateKey].totalNetSales += orderAmount;
    dailyTaxData[dateKey].orderCount += 1;
  });

  const taxData = Object.values(dailyTaxData).map((data: any) => ({
    ...data,
    grossTaxableSales: Number(data.grossTaxableSales.toFixed(2)),
    cgstCollected: Number(data.cgstCollected.toFixed(2)),
    sgstCollected: Number(data.sgstCollected.toFixed(2)),
    totalGST: Number(data.totalGST.toFixed(2)),
    totalNetSales: Number(data.totalNetSales.toFixed(2)),
  }));

  const summary = taxData.reduce(
    (acc, day) => ({
      totalGrossTaxableSales:
        acc.totalGrossTaxableSales + day.grossTaxableSales,
      totalCGST: acc.totalCGST + day.cgstCollected,
      totalSGST: acc.totalSGST + day.sgstCollected,
      totalGST: acc.totalGST + day.totalGST,
      totalNetSales: acc.totalNetSales + day.totalNetSales,
      totalOrders: acc.totalOrders + day.orderCount,
    }),
    {
      totalGrossTaxableSales: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalGST: 0,
      totalNetSales: 0,
      totalOrders: 0,
    }
  );

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    summary: {
      ...summary,
      totalGrossTaxableSales: Number(summary.totalGrossTaxableSales.toFixed(2)),
      totalCGST: Number(summary.totalCGST.toFixed(2)),
      totalSGST: Number(summary.totalSGST.toFixed(2)),
      totalGST: Number(summary.totalGST.toFixed(2)),
      totalNetSales: Number(summary.totalNetSales.toFixed(2)),
    },
    taxData,
  };
};

// 13. Sales by Employee Report (Staff Performance)
export const generateSalesByEmployeeReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);
  const { role } = query;

  const orders = await prisma.order.findMany({
    where: {
      ...filters,
      paymentStatus: PaymentStatus.PAID,
      user: role ? { role } : undefined,
    },
    include: {
      user: {
        include: {
          employee: true,
        },
      },
    },
  });

  // Group by employee
  const employeePerformance: Record<string, any> = {};

  orders.forEach((order) => {
    const userId = order.userId || "unassigned";
    const userName = order.user?.name || "Unassigned";
    const employeeCode = order.user?.employee?.employeeCode || "N/A";

    if (!employeePerformance[userId]) {
      employeePerformance[userId] = {
        userId,
        employeeName: userName,
        employeeCode,
        role: order.user?.role || "N/A",
        totalOrdersTaken: 0,
        totalSalesValue: 0,
        totalDiscountGiven: 0, // TODO: Add discount tracking
      };
    }

    employeePerformance[userId].totalOrdersTaken += 1;
    employeePerformance[userId].totalSalesValue += order.totalAmount.toNumber();
  });

  const performanceData = Object.values(employeePerformance)
    .map((emp: any) => ({
      ...emp,
      averageOrderValue:
        emp.totalOrdersTaken > 0
          ? emp.totalSalesValue / emp.totalOrdersTaken
          : 0,
    }))
    .sort((a, b) => b.totalSalesValue - a.totalSalesValue);

  const topPerformer = performanceData[0] || null;

  return {
    reportMeta: { ...query, generatedAt: new Date() },
    summary: {
      totalEmployees: performanceData.length,
      topPerformer: topPerformer
        ? {
            name: topPerformer.employeeName,
            sales: topPerformer.totalSalesValue,
          }
        : null,
    },
    performanceData,
  };
};

// 14. Discount & Promotion Analysis Report
export const generateDiscountAnalysisReport = async (
  restaurantId: string,
  query: any
) => {
  const filters = getCommonFilters(restaurantId, query);
  // const { discountType } = query;

  // Note: Current schema doesn't have discount tracking
  // This is a placeholder structure for when discount functionality is added
  const orders = await prisma.order.findMany({
    where: {
      ...filters,
      paymentStatus: PaymentStatus.PAID,
    },
  });

  // Placeholder data structure
  const discountData = {
    reportMeta: { ...query, generatedAt: new Date() },
    summary: {
      totalDiscountAmount: 0,
      totalOrdersWithDiscount: 0,
      averageDiscountPerOrder: 0,
      netSalesAfterDiscount: orders.reduce(
        (sum, order) => sum + order.totalAmount.toNumber(),
        0
      ),
    },
    discounts: [
      {
        discountName: "No Discount System",
        discountType: "N/A",
        totalOrdersUsedIn: 0,
        totalDiscountAmount: 0,
        averageDiscountPerOrder: 0,
        netSalesAfterDiscount: 0,
      },
    ],
    note: "Discount tracking not yet implemented in the system. Please add discount fields to Order model.",
  };

  return discountData;
};

// ===== Profit & Loss Report with Operational Expenses =====
export const generateProfitAndLossReport = async (
  restaurantId: string,
  query: any
) => {
  const { startDate, endDate } = query;
  const dateFilters: any = {};

  if (startDate || endDate) {
    dateFilters.createdAt = {
      gte: startDate ? startOfDay(parseISO(startDate)) : undefined,
      lte: endDate ? endOfDay(parseISO(endDate)) : undefined,
    };
    // Clean up undefined filters
    if (!dateFilters.createdAt.gte) delete dateFilters.createdAt.gte;
    if (!dateFilters.createdAt.lte) delete dateFilters.createdAt.lte;
    if (Object.keys(dateFilters.createdAt).length === 0)
      delete dateFilters.createdAt;
  }

  // 1. Calculate Total Revenue (Income from orders)
  const paidOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      paymentStatus: PaymentStatus.PAID,
      ...dateFilters,
    },
  });

  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + order.totalAmount.toNumber(),
    0
  );

  // 2. Calculate COGS (Cost of Goods Sold) from inventory purchases
  const purchaseFilters: any = { restaurantId };
  if (startDate || endDate) {
    purchaseFilters.purchaseDate = {
      gte: startDate ? startOfDay(parseISO(startDate)) : undefined,
      lte: endDate ? endOfDay(parseISO(endDate)) : undefined,
    };
    if (!purchaseFilters.purchaseDate.gte)
      delete purchaseFilters.purchaseDate.gte;
    if (!purchaseFilters.purchaseDate.lte)
      delete purchaseFilters.purchaseDate.lte;
    if (Object.keys(purchaseFilters.purchaseDate).length === 0)
      delete purchaseFilters.purchaseDate;
  }

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: purchaseFilters,
  });

  const totalCOGS = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  // 3. Calculate Operational Expenses (OpEx)
  const expenseFilters: any = { restaurantId };
  if (startDate || endDate) {
    expenseFilters.expenseDate = {
      gte: startDate ? startOfDay(parseISO(startDate)) : undefined,
      lte: endDate ? endOfDay(parseISO(endDate)) : undefined,
    };
    if (!expenseFilters.expenseDate.gte) delete expenseFilters.expenseDate.gte;
    if (!expenseFilters.expenseDate.lte) delete expenseFilters.expenseDate.lte;
    if (Object.keys(expenseFilters.expenseDate).length === 0)
      delete expenseFilters.expenseDate;
  }

  const expenses = await prisma.expense.findMany({
    where: expenseFilters,
    include: {
      category: true,
    },
  });

  const totalOpEx = expenses.reduce(
    (sum, expense) => sum + expense.amount.toNumber(),
    0
  );

  // Group expenses by category for detailed breakdown
  const expensesByCategory = expenses.reduce((acc: any, expense) => {
    const categoryName = expense.category?.name || "Uncategorized";
    if (!acc[categoryName]) {
      acc[categoryName] = {
        categoryName,
        categoryColor: expense.category?.color || "#6B7280",
        totalAmount: 0,
        count: 0,
      };
    }
    acc[categoryName].totalAmount += expense.amount.toNumber();
    acc[categoryName].count += 1;
    return acc;
  }, {});

  // 4. Calculate Gross Profit and Net Profit
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalOpEx;

  // 5. Calculate profit margins
  const grossProfitMargin =
    totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netProfitMargin =
    totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  return {
    reportMeta: {
      startDate,
      endDate,
      generatedAt: new Date(),
      restaurantId,
    },
    summary: {
      totalRevenue,
      totalCOGS,
      totalOpEx,
      grossProfit,
      netProfit,
      grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
    },
    breakdown: {
      revenue: {
        totalOrders: paidOrders.length,
        totalAmount: totalRevenue,
      },
      cogs: {
        totalPurchaseOrders: purchaseOrders.length,
        totalAmount: totalCOGS,
      },
      operationalExpenses: {
        totalExpenses: expenses.length,
        totalAmount: totalOpEx,
        byCategory: Object.values(expensesByCategory),
      },
    },
  };
};
