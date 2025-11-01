import { Router } from "express";
import { enforceTenancy } from "../../middlewares/tenancy.middleware.js";

import {
  authenticateJWT,
  authorizeRoles,
} from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as agentController from "./agent.controller.js";
import * as agentValidation from "./agent.validation.js";

const router = Router();

// This is our main chat endpoint.
// Only authenticated users (ADMINs) can access it.
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("ADMIN"), // Only allow ADMINs
  enforceTenancy, // Ensures req.restaurant is set
  validate(agentValidation.handleChat),
  agentController.handleChat
);

export default router;
