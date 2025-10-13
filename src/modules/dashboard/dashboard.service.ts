import prisma from "../../db/index.js";
import { startOfDay, endOfDay, subDays } from "date-fns";

/**
 * Fetches operational data for the Manager's dashboard.
 */
export const getManagerDashboardStats = async (restaurantId: string) => {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // 1. Live Sales and Orders for Today
  const todaysOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
      paymentStatus: "PAID",
    },
  });

  const totalRevenue = todaysOrders.reduce(
    (sum, order) => sum + order.totalAmount.toNumber(),
    0
  );
  const totalOrders = todaysOrders.length;

  // 2. Table Status
  const tables = await prisma.table.findMany({ where: { restaurantId } });
  const tableStatus = {
    occupied: tables.filter((t) => t.status === "Occupied").length,
    available: tables.filter((t) => t.status === "Available").length,
    reserved: tables.filter((t) => t.status === "Reserved").length,
    needsCleaning: tables.filter((t) => t.status === "NeedCleaning").length,
    total: tables.length,
  };

  // 3. Kitchen & Order Pipeline
  const activeOrders = await prisma.order.count({
    where: {
      restaurantId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
    },
  });

  // 4. Low Stock Alerts
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: {
      restaurantId,
      currentStock: {
        lte: prisma.inventoryItem.fields.reorderLevel,
      },
    },
    select: {
      id: true,
      name: true,
      currentStock: true,
      unit: true,
    },
  });

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    tableStatus,
    activeOrders,
    lowStockItems,
  };
};

/**
 * Fetches strategic data for the Admin's dashboard.
 */
export const getAdminDashboardStats = async (restaurantId: string) => {
  const thirtyDaysAgo = subDays(new Date(), 30);

  // 1. KPIs for the last 30 days
  const recentOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      paymentStatus: "PAID",
      createdAt: {
        gte: thirtyDaysAgo,
      },
    },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      payments: true,
    },
  });

  const totalRevenue = recentOrders.reduce(
    (sum, order) => sum + order.totalAmount.toNumber(),
    0
  );
  const totalCustomers = recentOrders.length;

  // 2. Sales Trend (example: daily sales for last 7 days)
  const sevenDaysAgo = subDays(new Date(), 7);
  const last7DaysOrders = await prisma.order.findMany({
    where: {
      restaurantId,
      paymentStatus: "PAID",
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const salesByDay = last7DaysOrders.reduce((acc, order) => {
    const day = order.createdAt.toISOString().split("T")[0];
    if (day) {
      acc[day] = (acc[day] || 0) + order.totalAmount.toNumber();
    }
    return acc;
  }, {} as Record<string, number>);

  // 3. Top Selling Items
  const itemSales = recentOrders
    .flatMap((order) => order.orderItems)
    .reduce((acc, item) => {
      const name = item.menuItem?.name ?? "Unknown Item";
      acc[name] = (acc[name] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

  const topSellingItems = Object.entries(itemSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }));

  // 4. Sales by Payment Mode
  const paymentModes = recentOrders
    .flatMap((order) => order.payments)
    .reduce((acc, payment) => {
      acc[payment.paymentMethod] =
        (acc[payment.paymentMethod] || 0) + payment.amount.toNumber();
      return acc;
    }, {} as Record<string, number>);

  return {
    totalRevenue,
    totalCustomers,
    averageOrderValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
    salesTrend: salesByDay,
    topSellingItems,
    paymentModes,
  };
};
