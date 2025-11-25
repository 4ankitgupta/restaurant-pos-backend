import { Router } from "express";
import { getPublicBill } from "./public.controller.js";

const router = Router();

// Public route to get bill by token (no authentication required)
router.get("/bill/:token", getPublicBill);

export default router;
