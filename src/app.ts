// src/app.ts
import express, {
  type Application,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import morgan from "morgan"; // Import morgan
import logger, { morganStream } from "./config/logger.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";
import httpStatus from "http-status";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// --- Import Routes ---
import authRoutes from "./modules/auth/auth.routes.js";
import orderRoutes from "./modules/order/order.routes.js";
import chefRoutes from "./modules/chef/chef.routes.js";
import paymentRoutes from "./modules/payment/payment.routes.js";
import tableRoutes from "./modules/table/table.routes.js";
import menuCategoryRoutes from "./modules/menuCategory/menuCategory.routes.js";
import menuItemRoutes from "./modules/menuItem/menuItem.routes.js";
import inventoryRoutes from "./modules/inventory/inventory.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import waiterRoutes from "./modules/waiter/waiter.routes.js";
import supplierRoutes from "./modules/supplier/supplier.routes.js";
import purchaseOrderRoutes from "./modules/purchaseOrder/purchaseOrder.routes.js";
import stockLogRoutes from "./modules/stockLog/stockLog.routes.js";
import cashierRoutes from "./modules/cashier/cashier.routes.js";
import dashboardRouter from "./modules/dashboard/dashboard.routes.js";
import reportRoutes from "./modules/reports/reports.routes.js";
import agentRoutes from "./modules/agent/agent.routes.js";
import employeeRoutes from "./modules/employee/employee.routes.js";
import attendanceRoutes from "./modules/attendance/attendance.routes.js";
import zomatoRoutes from "./modules/zomato/zomato.routes.js";

const app: Application = express();

// --- Middlewares ---
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cors({ origin: "*", credentials: true }));

// --- HTTP Request Logging ---
// Use 'combined' format for production and 'dev' for development
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
// Pipe morgan output to our winston logger
app.use(morgan(morganFormat, { stream: morganStream }));

// --- API Routes ---
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/chef", chefRoutes);
apiRouter.use("/payments", paymentRoutes);
apiRouter.use("/tables", tableRoutes);
apiRouter.use("/menu-categories", menuCategoryRoutes);
apiRouter.use("/menu-items", menuItemRoutes);
apiRouter.use("/inventory", inventoryRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/waiter", waiterRoutes);
apiRouter.use("/suppliers", supplierRoutes);
apiRouter.use("/purchase-orders", purchaseOrderRoutes);
apiRouter.use("/stock-logs", stockLogRoutes);
apiRouter.use("/cashier", cashierRoutes);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/reports", reportRoutes);
apiRouter.use("/agent", agentRoutes);
apiRouter.use("/employees", employeeRoutes);
apiRouter.use("/attendance", attendanceRoutes);
// Public routes for third-party integrations
apiRouter.use("/public/zomato", zomatoRoutes);

// All API calls will be under /api/v1
app.use("/api/v1", apiRouter);

// --- Define __dirname for ES Modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Serve Frontend ---
const reactBuildPath = path.resolve(__dirname, "../distfrontend");

if (fs.existsSync(reactBuildPath)) {
  logger.info(`🚀 Serving React build from: ${reactBuildPath}`);

  // Serve static assets from the 'dist' folder
  app.use(express.static(reactBuildPath));

  // For any other GET request that doesn't start with /api,
  // send the React app's index.html. This is the catch-all for client-side routing.
  app.get(/^(?!\/api\/).*/, (req: Request, res: Response) => {
    res.sendFile(path.join(reactBuildPath, "index.html"));
  });
} else {
  logger.warn(`⚠️ React build folder not found at: ${reactBuildPath}`);
  logger.warn("Please run 'npm run build' in your frontend project first.");

  // Health Check if frontend not found
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      status: "success",
      message: "POS Backend is up and running! Frontend not found.",
    });
  });
}

// --- Handle Not Found API routes ---
// This will only be reached for API routes that don't exist
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, "API endpoint not found"));
});

// --- Central Error Handler ---
app.use(errorHandler);

export default app;
