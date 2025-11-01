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
