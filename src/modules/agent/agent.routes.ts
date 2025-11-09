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

// --- ADD THIS ROUTE ---
// To get the list of all conversations for the admin
router.get(
  "/conversations",
  authenticateJWT,
  authorizeRoles("ADMIN"),
  enforceTenancy,
  agentController.getConversations
);

// --- AND ADD THIS ROUTE ---
// To get all messages for a single, selected conversation
router.get(
  "/conversations/:conversationId",
  authenticateJWT,
  authorizeRoles("ADMIN"),
  enforceTenancy,
  validate(agentValidation.getConversationMessages),
  agentController.getConversationMessages
);

// --- Delete Conversation Route ---
router.delete(
  "/conversations/:conversationId",
  authenticateJWT,
  authorizeRoles("ADMIN"),
  enforceTenancy,
  validate(agentValidation.deleteConversation),
  agentController.deleteConversation
);

export default router;
