import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "../../db/index.js";

/**
 * Universal Sales Analytics Tool
 * Replaces: createTodaysSalesSummaryTool, createMonthlyRevenueReportTool, createOrderTrendsAnalysisTool
 *
 * This tool can handle ANY date range and optional grouping/breakdown
 */
export function createSalesAnalyticsTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "get_sales_analytics",
    description:
      "Analyze sales revenue, order counts, and payment methods for ANY date range (today, yesterday, last week, last month, specific dates, etc.). Supports optional breakdown by day, month, payment method, or waiter.",
    schema: z.object({
      startDate: z
        .string()
        .describe(
          "Start date in ISO format (YYYY-MM-DD). Example: '2024-01-01'"
        ),
      endDate: z
        .string()
        .describe("End date in ISO format (YYYY-MM-DD). Example: '2024-01-31'"),
      groupBy: z
        .enum(["day", "month", "paymentMethod", "waiter", "status"])
        .optional()
        .describe(
          "Optional grouping: 'day' for daily breakdown, 'month' for monthly, 'paymentMethod' for payment breakdown, 'waiter' for per-waiter stats, 'status' for order status breakdown"
        ),
    }),
    func: async ({ startDate, endDate, groupBy }) => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Make end date inclusive

        // Validate dates
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return "Error: Invalid date format. Use YYYY-MM-DD format.";
        }
        if (start > end) {
          return "Error: Start date must be before or equal to end date.";
        }

        // 1. Base Aggregates (Total Revenue & Order Count)
        const aggregates = await prisma.order.aggregate({
          where: {
            restaurantId,
            createdAt: { gte: start, lte: end },
          },
          _sum: { totalAmount: true },
          _count: { id: true },
        });

        const totalRevenue = Number(aggregates._sum.totalAmount || 0);
        const totalOrders = aggregates._count.id;
        const averageOrderValue =
          totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // 2. Completed vs Other Status
        const statusBreakdown = await prisma.order.groupBy({
          by: ["status"],
          where: {
            restaurantId,
            createdAt: { gte: start, lte: end },
          },
          _count: { id: true },
          _sum: { totalAmount: true },
        });

        let breakdown: any = null;

        // 3. Optional Grouping
        if (groupBy === "paymentMethod") {
          breakdown = await prisma.payment.groupBy({
            by: ["paymentMethod"],
            where: {
              restaurantId,
              createdAt: { gte: start, lte: end },
            },
            _sum: { amount: true },
            _count: { id: true },
          });

          breakdown = breakdown.map((item: any) => ({
            paymentMethod: item.paymentMethod,
            totalAmount: Number(item._sum.amount || 0).toFixed(2),
            transactionCount: item._count.id,
          }));
        } else if (groupBy === "day") {
          // Group by day
          const orders = await prisma.order.findMany({
            where: {
              restaurantId,
              createdAt: { gte: start, lte: end },
            },
            select: {
              createdAt: true,
              totalAmount: true,
              status: true,
            },
          });

          const dailyMap: Record<string, { revenue: number; orders: number }> =
            {};
          orders.forEach((order) => {
            const date = order.createdAt.toISOString().split("T")[0];
            if (date) {
              if (!dailyMap[date]) {
                dailyMap[date] = { revenue: 0, orders: 0 };
              }
              dailyMap[date].revenue += Number(order.totalAmount);
              dailyMap[date].orders += 1;
            }
          });

          breakdown = Object.entries(dailyMap)
            .map(([date, data]) => ({
              date,
              revenue: data.revenue.toFixed(2),
              orders: data.orders,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
        } else if (groupBy === "month") {
          // Group by month
          const orders = await prisma.order.findMany({
            where: {
              restaurantId,
              createdAt: { gte: start, lte: end },
            },
            select: {
              createdAt: true,
              totalAmount: true,
            },
          });

          const monthlyMap: Record<
            string,
            { revenue: number; orders: number }
          > = {};
          orders.forEach((order) => {
            const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
            if (!monthlyMap[month]) {
              monthlyMap[month] = { revenue: 0, orders: 0 };
            }
            monthlyMap[month].revenue += Number(order.totalAmount);
            monthlyMap[month].orders += 1;
          });

          breakdown = Object.entries(monthlyMap)
            .map(([month, data]) => ({
              month,
              revenue: data.revenue.toFixed(2),
              orders: data.orders,
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
        } else if (groupBy === "waiter") {
          // Group by waiter (user)
          const waiterStats = await prisma.order.groupBy({
            by: ["userId"],
            where: {
              restaurantId,
              createdAt: { gte: start, lte: end },
              userId: { not: null },
            },
            _sum: { totalAmount: true },
            _count: { id: true },
          });

          // Get user names
          const userIds = waiterStats
            .map((s) => s.userId)
            .filter(Boolean) as string[];
          const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, role: true },
          });

          const userMap = new Map(users.map((u) => [u.id, u]));

          breakdown = waiterStats.map((stat) => {
            const user = stat.userId ? userMap.get(stat.userId) : null;
            return {
              userId: stat.userId || "Unknown",
              userName: user?.name || "Unknown",
              role: user?.role || "Unknown",
              totalRevenue: Number(stat._sum.totalAmount || 0).toFixed(2),
              orderCount: stat._count.id,
            };
          });
        } else if (groupBy === "status") {
          breakdown = statusBreakdown.map((item: any) => ({
            status: item.status,
            orderCount: item._count.id,
            totalRevenue: Number(item._sum.totalAmount || 0).toFixed(2),
          }));
        }

        // 4. Return comprehensive result
        const result = {
          period: {
            startDate,
            endDate,
            daysAnalyzed:
              Math.ceil(
                (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1,
          },
          summary: {
            totalRevenue: totalRevenue.toFixed(2),
            totalOrders,
            averageOrderValue: averageOrderValue.toFixed(2),
          },
          statusBreakdown: statusBreakdown.map((item: any) => ({
            status: item.status,
            count: item._count.id,
            revenue: Number(item._sum.totalAmount || 0).toFixed(2),
          })),
          breakdown: breakdown || "Not requested (use groupBy parameter)",
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error analyzing sales: ${message}`;
      }
    },
  });
}

/**
 * Universal Inventory Tool
 * Replaces: createLowStockItemsTool
 *
 * This tool can check specific items OR find low stock items with flexible filtering
 */
export function createInventoryTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "check_inventory_status",
    description:
      "Check current stock levels. Can search for specific items by name OR find low stock items. Supports filtering by stock level thresholds.",
    schema: z.object({
      itemName: z
        .string()
        .optional()
        .describe(
          "Optional: Search for a specific item name (e.g., 'Tomato', 'Chicken'). Case-insensitive partial match."
        ),
      onlyLowStock: z
        .boolean()
        .optional()
        .describe(
          "Optional: If true, only returns items where currentStock <= reorderLevel"
        ),
      stockThreshold: z
        .number()
        .optional()
        .describe(
          "Optional: Custom threshold. Returns items with stock below this value. Overrides reorderLevel if set."
        ),
      limit: z
        .number()
        .optional()
        .default(50)
        .describe("Maximum number of items to return (default 50)"),
    }),
    func: async ({ itemName, onlyLowStock, stockThreshold, limit = 50 }) => {
      try {
        const where: any = { restaurantId };

        // Filter by name if provided
        if (itemName) {
          where.name = { contains: itemName, mode: "insensitive" };
        }

        // Filter by stock threshold if provided
        if (stockThreshold !== undefined) {
          where.currentStock = { lte: stockThreshold };
        }

        // Fetch items
        const items = await prisma.inventoryItem.findMany({
          where,
          select: {
            id: true,
            name: true,
            currentStock: true,
            unit: true,
            reorderLevel: true,
            lastUpdated: true,
          },
          orderBy: { currentStock: "asc" },
          take: limit,
        });

        if (items.length === 0) {
          return "No inventory items found matching the criteria.";
        }

        // Post-filter for low stock if using reorderLevel (per-item threshold)
        let filteredItems = items;
        if (onlyLowStock && stockThreshold === undefined) {
          filteredItems = items.filter(
            (item) => item.currentStock <= item.reorderLevel
          );
        }

        if (filteredItems.length === 0) {
          return "No low stock items found.";
        }

        // Categorize by urgency
        const outOfStock = filteredItems.filter(
          (item) => item.currentStock <= 0
        );
        const criticallyLow = filteredItems.filter(
          (item) =>
            item.currentStock > 0 && item.currentStock <= item.reorderLevel / 2
        );
        const low = filteredItems.filter(
          (item) =>
            item.currentStock > item.reorderLevel / 2 &&
            item.currentStock <= item.reorderLevel
        );

        const result = {
          searchCriteria: {
            itemName: itemName || "All items",
            onlyLowStock: onlyLowStock || false,
            stockThreshold: stockThreshold || "Using per-item reorderLevel",
          },
          summary: {
            totalItems: filteredItems.length,
            outOfStock: outOfStock.length,
            criticallyLow: criticallyLow.length,
            low: low.length,
          },
          items: filteredItems.map((item) => {
            let status = "OK";
            if (item.currentStock <= 0) status = "OUT_OF_STOCK";
            else if (item.currentStock <= item.reorderLevel / 2)
              status = "CRITICALLY_LOW";
            else if (item.currentStock <= item.reorderLevel) status = "LOW";

            return {
              name: item.name,
              currentStock: item.currentStock,
              unit: item.unit,
              reorderLevel: item.reorderLevel,
              status,
              lastUpdated: item.lastUpdated.toISOString().split("T")[0],
            };
          }),
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error checking inventory: ${message}`;
      }
    },
  });
}

/**
 * Popular Items Tool
 * Analyzes top-selling items for a given date range
 */
export function createPopularItemsTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "get_popular_items",
    description:
      "Get the most popular/top-selling menu items for any date range, ranked by quantity sold or revenue.",
    schema: z.object({
      startDate: z.string().describe("Start date in ISO format (YYYY-MM-DD)"),
      endDate: z.string().describe("End date in ISO format (YYYY-MM-DD)"),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Number of top items to return (default 10)"),
      sortBy: z
        .enum(["quantity", "revenue"])
        .optional()
        .default("quantity")
        .describe("Sort by 'quantity' (items sold) or 'revenue' (total sales)"),
    }),
    func: async ({ startDate, endDate, limit = 10, sortBy = "quantity" }) => {
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return "Error: Invalid date format. Use YYYY-MM-DD format.";
        }

        // Get all order items in the date range
        const orderItems = await prisma.orderItem.findMany({
          where: {
            restaurantId,
            createdAt: { gte: start, lte: end },
          },
          include: {
            menuItemVariant: {
              include: {
                menuItem: {
                  include: {
                    category: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (orderItems.length === 0) {
          return "No orders found in the specified date range.";
        }

        // Aggregate by menu item variant
        const itemStats: Record<
          string,
          {
            itemName: string;
            variantName: string;
            category: string;
            quantity: number;
            revenue: number;
            orderCount: number;
          }
        > = {};

        orderItems.forEach((item) => {
          if (!item.menuItemVariant) return;

          const variantId = item.menuItemVariantId!;
          const menuItem = item.menuItemVariant.menuItem;

          if (!itemStats[variantId]) {
            itemStats[variantId] = {
              itemName: menuItem.name,
              variantName: item.menuItemVariant.name,
              category: menuItem.category?.name || "Uncategorized",
              quantity: 0,
              revenue: 0,
              orderCount: 0,
            };
          }

          itemStats[variantId].quantity += item.quantity;
          itemStats[variantId].revenue += Number(item.price) * item.quantity;
          itemStats[variantId].orderCount += 1;
        });

        // Sort and limit
        const sortedItems = Object.values(itemStats)
          .sort((a, b) => {
            if (sortBy === "revenue") {
              return b.revenue - a.revenue;
            }
            return b.quantity - a.quantity;
          })
          .slice(0, limit);

        const result = {
          period: {
            startDate,
            endDate,
          },
          sortedBy: sortBy,
          topItems: sortedItems.map((item, index) => ({
            rank: index + 1,
            itemName: item.itemName,
            variant: item.variantName,
            category: item.category,
            quantitySold: item.quantity,
            totalRevenue: item.revenue.toFixed(2),
            timesOrdered: item.orderCount,
          })),
          totalUniqueItems: Object.keys(itemStats).length,
        };

        return JSON.stringify(result, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error analyzing popular items: ${message}`;
      }
    },
  });
}
