import { Router } from "express";
import { getAllMenuCategoriesController } from "./menuCategory.controller.js";
import { authenticateJWT } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authenticateJWT, getAllMenuCategoriesController);

export default router;
