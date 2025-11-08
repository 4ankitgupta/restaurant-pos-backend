import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "../../db/index.js";

/**
 * Tool: Get Today's Sales Summary
 */
export function createTodaysSalesSummaryTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "get_todays_sales_summary",
    description:
      "Get a comprehensive summary of today's sales including total revenue, number of orders, average order value, and payment method breakdown.",
    schema: z.object({}).passthrough(),
    func: async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get all today's orders with payments
        const orders = await prisma.order.findMany({
          where: {
            restaurantId,
            createdAt: {
              gte: today,
              lt: tomorrow,
            },
          },
          include: {
            payments: true,
          },
        });

        // Calculate metrics
        const totalRevenue = orders.reduce(
          (sum, order) => sum + Number(order.totalAmount),
          0
        );
        const totalOrders = orders.length;
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Payment method breakdown
        const paymentBreakdown: Record<string, number> = {};
        orders.forEach((order) => {
          order.payments.forEach((payment: any) => {
            const method = payment.paymentMethod;
            paymentBreakdown[method] =
              (paymentBreakdown[method] || 0) + Number(payment.amount);
          });
        });

        // Order status breakdown
        const statusBreakdown = orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const result = {
          date: today.toISOString().split("T")[0],
          totalRevenue: totalRevenue.toFixed(2),
          totalOrders,
          averageOrderValue: averageOrderValue.toFixed(2),
          paymentMethodBreakdown: paymentBreakdown,
          orderStatusBreakdown: statusBreakdown,
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error fetching today's sales summary: ${message}`;
      }
    },
  });
}

/**
 * Tool: Get Most Popular Items This Week
 */
export function createPopularItemsThisWeekTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "get_popular_items_this_week",
    description:
      "Get the most popular menu items ordered this week, ranked by quantity sold.",
    schema: z
      .object({
        limit: z
          .number()
          .optional()
          .default(10)
          .describe("Number of top items to return (default 10)"),
      })
      .passthrough(),
    func: async ({ limit = 10 }) => {
      try {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        // Get order items from this week
        const orderItems = await prisma.orderItem.findMany({
          where: {
            order: {
              restaurantId,
              createdAt: {
                gte: weekStart,
              },
            },
          },
        });

        // Get menu items separately
        const menuItemIds = [...new Set(orderItems.map((oi) => oi.id))];
        const menuItems = await prisma.menuItem.findMany({
          where: {
            id: { in: menuItemIds },
          },
          include: {
            category: {
              select: {
                name: true,
              },
            },
          },
        });

        const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));

        // Aggregate by order ID (which corresponds to menuItem)
        const itemStats: Record<
          string,
          {
            name: string;
            category: string;
            price: string;
            totalQuantity: number;
            totalRevenue: number;
            orderCount: number;
          }
        > = {};

        orderItems.forEach((item) => {
          const itemId = item.id;
          const menuItem = menuItemMap.get(itemId);
          if (!menuItem) return;

          if (!itemStats[itemId]) {
            itemStats[itemId] = {
              name: menuItem.name,
              category: menuItem.category?.name || "Uncategorized",
              price: Number(item.price).toFixed(2),
              totalQuantity: 0,
              totalRevenue: 0,
              orderCount: 0,
            };
          }
          itemStats[itemId].totalQuantity += item.quantity;
          itemStats[itemId].totalRevenue += Number(item.price) * item.quantity;
          itemStats[itemId].orderCount += 1;
        });

        // Convert to array and sort by quantity
        const popularItems = Object.values(itemStats)
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, limit)
          .map((item) => ({
            name: item.name,
            category: item.category,
            price: item.price,
            quantitySold: item.totalQuantity,
            totalRevenue: item.totalRevenue.toFixed(2),
            timesOrdered: item.orderCount,
          }));

        const result = {
          weekStart: weekStart.toISOString().split("T")[0],
          weekEnd: today.toISOString().split("T")[0],
          topItems: popularItems,
          totalItemsAnalyzed: Object.keys(itemStats).length,
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error fetching popular items: ${message}`;
      }
    },
  });
}

/**
 * Tool: Generate Monthly Revenue Report
 */
export function createMonthlyRevenueReportTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "get_monthly_revenue_report",
    description:
      "Generate a detailed revenue report for the current month including daily breakdown, payment methods, and comparison with previous periods.",
    schema: z
      .object({
        month: z
          .number()
          .optional()
          .describe("Month number (1-12). Defaults to current month."),
        year: z.number().optional().describe("Year. Defaults to current year."),
      })
      .passthrough(),
    func: async ({ month, year }) => {
      try {
        const now = new Date();
        const targetMonth = month || now.getMonth() + 1;
        const targetYear = year || now.getFullYear();

        const monthStart = new Date(targetYear, targetMonth - 1, 1);
        const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59);

        // Get all orders for the month
        const orders = await prisma.order.findMany({
          where: {
            restaurantId,
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          include: {
            payments: true,
          },
        });

        // Calculate total revenue
        const totalRevenue = orders.reduce(
          (sum, order) => sum + Number(order.totalAmount),
          0
        );

        // Daily breakdown
        const dailyBreakdown: Record<
          string,
          { revenue: number; orders: number }
        > = {};
        orders.forEach((order) => {
          const date = order.createdAt.toISOString().split("T")[0];
          if (date) {
            if (!dailyBreakdown[date]) {
              dailyBreakdown[date] = { revenue: 0, orders: 0 };
            }
            dailyBreakdown[date].revenue += Number(order.totalAmount);
            dailyBreakdown[date].orders += 1;
          }
        });

        // Payment method breakdown
        const paymentBreakdown: Record<string, number> = {};
        orders.forEach((order) => {
          order.payments.forEach((payment: any) => {
            const method = payment.paymentMethod;
            paymentBreakdown[method] =
              (paymentBreakdown[method] || 0) + Number(payment.amount);
          });
        });

        // Calculate averages
        const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
        const averageDailyRevenue = totalRevenue / daysInMonth;
        const averageOrderValue =
          orders.length > 0 ? totalRevenue / orders.length : 0;

        const result = {
          month: targetMonth,
          year: targetYear,
          monthName: monthStart.toLocaleDateString("en-US", { month: "long" }),
          totalRevenue: totalRevenue.toFixed(2),
          totalOrders: orders.length,
          averageDailyRevenue: averageDailyRevenue.toFixed(2),
          averageOrderValue: averageOrderValue.toFixed(2),
          paymentMethodBreakdown: paymentBreakdown,
          dailyBreakdown: Object.entries(dailyBreakdown)
            .map(([date, data]) => ({
              date,
              revenue: data.revenue.toFixed(2),
              orders: data.orders,
            }))
            .sort((a, b) => a.date.localeCompare(b.date)),
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error generating monthly revenue report: ${message}`;
      }
    },
  });
}

/**
 * Tool: Check Low Stock Items
 */
export function createLowStockItemsTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "check_low_stock_items",
    description:
      "Check inventory items that are running low on stock and need to be reordered soon.",
    schema: z
      .object({
        threshold: z
          .number()
          .optional()
          .default(20)
          .describe("Stock level threshold to consider as 'low' (default 20)"),
      })
      .passthrough(),
    func: async ({ threshold = 20 }) => {
      try {
        // Get all inventory items for the restaurant
        const inventoryItems = await prisma.inventoryItem.findMany({
          where: {
            restaurantId,
            currentStock: {
              lte: threshold,
            },
          },
          orderBy: {
            currentStock: "asc",
          },
        });

        // Categorize by urgency
        const outOfStock = inventoryItems.filter(
          (item) => item.currentStock <= 0
        );
        const criticallyLow = inventoryItems.filter(
          (item) => item.currentStock > 0 && item.currentStock <= threshold / 2
        );
        const low = inventoryItems.filter(
          (item) =>
            item.currentStock > threshold / 2 && item.currentStock <= threshold
        );

        const result = {
          threshold,
          summary: {
            totalLowStockItems: inventoryItems.length,
            outOfStock: outOfStock.length,
            criticallyLow: criticallyLow.length,
            low: low.length,
          },
          outOfStockItems: outOfStock.map((item) => ({
            id: item.id,
            name: item.name,
            currentStock: item.currentStock,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
            status: "OUT_OF_STOCK",
          })),
          criticallyLowItems: criticallyLow.map((item) => ({
            id: item.id,
            name: item.name,
            currentStock: item.currentStock,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
            status: "CRITICALLY_LOW",
          })),
          lowStockItems: low.map((item) => ({
            id: item.id,
            name: item.name,
            currentStock: item.currentStock,
            unit: item.unit,
            reorderLevel: item.reorderLevel,
            status: "LOW",
          })),
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error checking low stock items: ${message}`;
      }
    },
  });
}

/**
 * Tool: Get Yesterday's Performance Summary
 */
export function createYesterdayPerformanceTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "get_yesterday_performance",
    description:
      "Get a comprehensive performance summary for yesterday including sales, orders, popular items, and operational metrics.",
    schema: z.object({}).passthrough(),
    func: async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Get yesterday's orders
        const orders = await prisma.order.findMany({
          where: {
            restaurantId,
            createdAt: {
              gte: yesterday,
              lt: today,
            },
          },
          include: {
            payments: true,
          },
        });

        // Get order items separately
        const orderIds = orders.map((o) => o.id);
        const orderItems = await prisma.orderItem.findMany({
          where: {
            orderId: { in: orderIds },
          },
        });

        // Get menu items
        const menuItemIds = [...new Set(orderItems.map((oi) => oi.id))];
        const menuItems = await prisma.menuItem.findMany({
          where: {
            id: { in: menuItemIds },
          },
        });
        const menuItemMap = new Map(menuItems.map((mi) => [mi.id, mi]));

        // Calculate metrics
        const totalRevenue = orders.reduce(
          (sum, order) => sum + Number(order.totalAmount),
          0
        );
        const totalOrders = orders.length;
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Status breakdown
        const statusBreakdown = orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Top 5 items
        const itemCounts: Record<
          string,
          { name: string; count: number; revenue: number }
        > = {};
        orderItems.forEach((item) => {
          const itemId = item.id;
          const menuItem = menuItemMap.get(itemId);
          if (!menuItem) return;

          if (!itemCounts[itemId]) {
            itemCounts[itemId] = {
              name: menuItem.name,
              count: 0,
              revenue: 0,
            };
          }
          itemCounts[itemId].count += item.quantity;
          itemCounts[itemId].revenue += Number(item.price) * item.quantity;
        });

        const topItems = Object.values(itemCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map((item) => ({
            name: item.name,
            quantitySold: item.count,
            revenue: item.revenue.toFixed(2),
          }));

        // Payment breakdown
        const paymentBreakdown: Record<string, number> = {};
        orders.forEach((order) => {
          order.payments.forEach((payment: any) => {
            const method = payment.paymentMethod;
            paymentBreakdown[method] =
              (paymentBreakdown[method] || 0) + Number(payment.amount);
          });
        });

        const result = {
          date: yesterday.toISOString().split("T")[0],
          salesSummary: {
            totalRevenue: totalRevenue.toFixed(2),
            totalOrders,
            averageOrderValue: averageOrderValue.toFixed(2),
          },
          orderStatusBreakdown: statusBreakdown,
          topSellingItems: topItems,
          paymentMethodBreakdown: paymentBreakdown,
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error fetching yesterday's performance: ${message}`;
      }
    },
  });
}

/**
 * Tool: Analyze Recent Order Trends
 */
export function createOrderTrendsAnalysisTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "analyze_order_trends",
    description:
      "Analyze recent order trends including order volume, peak hours, average preparation time, and order patterns over the past week.",
    schema: z
      .object({
        days: z
          .number()
          .optional()
          .default(7)
          .describe("Number of days to analyze (default 7)"),
      })
      .passthrough(),
    func: async ({ days = 7 }) => {
      try {
        const now = new Date();
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        // Get orders for the period
        const orders = await prisma.order.findMany({
          where: {
            restaurantId,
            createdAt: {
              gte: startDate,
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });

        // Daily order counts
        const dailyCounts: Record<string, number> = {};
        const dailyRevenue: Record<string, number> = {};
        orders.forEach((order) => {
          const date = order.createdAt.toISOString().split("T")[0];
          if (date) {
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
            dailyRevenue[date] =
              (dailyRevenue[date] || 0) + Number(order.totalAmount);
          }
        });

        // Peak hours analysis (0-23)
        const hourlyDistribution: Record<number, number> = {};
        orders.forEach((order) => {
          const hour = order.createdAt.getHours();
          hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        });

        const peakHours = Object.entries(hourlyDistribution)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([hour, count]) => ({
            hour: `${hour}:00`,
            orderCount: count,
          }));

        // Order status distribution
        const statusDistribution = orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Calculate averages
        const totalRevenue = orders.reduce(
          (sum, order) => sum + Number(order.totalAmount),
          0
        );
        const averageOrderValue =
          orders.length > 0 ? totalRevenue / orders.length : 0;
        const averageOrdersPerDay = orders.length / days;

        // Day of week analysis
        const dayOfWeekCounts: Record<string, number> = {};
        orders.forEach((order) => {
          const dayName = order.createdAt.toLocaleDateString("en-US", {
            weekday: "long",
          });
          dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
        });

        const result = {
          analysisPeriod: {
            startDate: startDate.toISOString().split("T")[0],
            endDate: now.toISOString().split("T")[0],
            days,
          },
          summary: {
            totalOrders: orders.length,
            totalRevenue: totalRevenue.toFixed(2),
            averageOrderValue: averageOrderValue.toFixed(2),
            averageOrdersPerDay: averageOrdersPerDay.toFixed(1),
          },
          dailyTrends: Object.entries(dailyCounts).map(([date, count]) => ({
            date,
            orders: count,
            revenue: (dailyRevenue[date] || 0).toFixed(2),
          })),
          peakHours,
          dayOfWeekDistribution: dayOfWeekCounts,
          orderStatusDistribution: statusDistribution,
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error analyzing order trends: ${message}`;
      }
    },
  });
}
