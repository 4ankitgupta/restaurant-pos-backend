import { Router } from "express";
import { getAllTablesController } from "./table.controller.js";
import { authenticateJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticateJWT, getAllTablesController);

export default router;
