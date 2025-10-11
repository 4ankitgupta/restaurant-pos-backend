// src/app.ts
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware.js";
import { ApiError } from "./utils/ApiError.js";
import httpStatus from "http-status";

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
import supplierRoutes from "./modules/supplier/supplier.routes.js"; // <-- ADD THIS
import purchaseOrderRoutes from "./modules/purchaseOrder/purchaseOrder.routes.js"; // <-- ADD THIS
import stockLogRoutes from "./modules/stockLog/stockLog.routes.js"; // <-- ADD THIS
import cashierRoutes from "./modules/cashier/cashier.routes.js";

const app: Application = express();

// --- Middlewares ---
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cors({ origin: "*", credentials: true }));

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
apiRouter.use("/suppliers", supplierRoutes); // <-- ADD THIS
apiRouter.use("/purchase-orders", purchaseOrderRoutes); // <-- ADD THIS
apiRouter.use("/stock-logs", stockLogRoutes); // <-- ADD THIS
apiRouter.use("/cashier", cashierRoutes);

app.use("/api/v1", apiRouter);

// --- Health Check ---
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "POS Backend is up and running!",
  });
});

// --- Handle Not Found ---
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not Found"));
});

// --- Central Error Handler ---
app.use(errorHandler);

export default app;
