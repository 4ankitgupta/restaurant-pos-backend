import express, { Application, Request, Response } from "express";
import cors from "cors";
import { errorHandler } from "./middlewares/error.middleware";
import { ApiError } from "./utils/ApiError";
import httpStatus from "http-status";

// --- Import Routes ---
import authRoutes from "./modules/auth/auth.routes";
// ... import other routes as you create them

const app: Application = express();

// --- Middlewares ---
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cors({ origin: "*", credentials: true }));

// --- API Routes ---
const apiRouter = express.Router();
apiRouter.use("/auth", authRoutes);
// apiRouter.use('/users', userRoutes);
// ... use other routes

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
