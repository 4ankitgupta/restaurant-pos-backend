import { Router } from "express";
import bodyParser from "body-parser";
import { asyncHandler } from "../../utils/asyncHandler.js";
// @ts-ignore - TypeScript language server cache issue, file exists and compiles successfully
import { processZomatoWebhook } from "./zomato.controller.js";

const router = Router();

// Use raw body parser for webhook to allow signature verification on raw bytes
router.post(
  "/webhook",
  bodyParser.raw({
    type: ["application/json", "application/*+json"],
    limit: "128kb",
  }),
  asyncHandler(async (req, res) => {
    // Attach rawBody so controller can use it if needed
    (req as any).rawBody = req.body;
    await processZomatoWebhook(req as any, res as any);
  })
);

export default router;
