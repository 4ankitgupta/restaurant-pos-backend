import { type Request, type Response } from "express";
import prisma from "../../db/index.js";
import httpStatus from "http-status";
import { decrypt } from "../../utils/cryptoService.js";
import { ApiError } from "../../utils/ApiError.js";
import { zomatoOrderToPos } from "../order/order.service.js";
import crypto from "crypto";
import { broadcastToRestaurant } from "../../websocketServer.js";

/**
 * Public webhook endpoint for Zomato to POST order events.
 *
 * Expected usage:
 * - Zomato will call this endpoint with raw JSON body
 * - Provide restaurant identifier via query param `resId` or header `x-restaurant-id`
 * - Provide HMAC signature in header `x-zomato-signature` (hex) computed as HMAC-SHA256(rawBody, webhookSecret)
 */
export async function processZomatoWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const rawBody =
      (req as any).rawBody ??
      (req.body && typeof req.body === "string"
        ? Buffer.from(req.body)
        : undefined);

    // If the application used express.json globally, rawBody won't be present.
    // We still support the parsed body as fallback, but signature verification may fail.

    const restaurantId =
      (req.query.resId as string) || req.header("x-restaurant-id");
    if (!restaurantId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Missing restaurant identifier. Provide ?resId=... or header x-restaurant-id"
      );
    }

    const signatureHeader =
      req.header("x-zomato-signature") || req.header("x-hub-signature");

    const integration = await prisma.zomatoIntegration.findUnique({
      where: { restaurantId },
    });
    if (!integration || !integration.isConfigured) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "Zomato integration not configured for this restaurant"
      );
    }

    // If webhook secret exists, verify signature
    if (integration.webhookSecretEncrypted) {
      const secret = decrypt(integration.webhookSecretEncrypted);

      if (!signatureHeader) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Missing signature header");
      }

      // Compute HMAC-SHA256 of raw body
      const bodyBuffer = rawBody ?? Buffer.from(JSON.stringify(req.body));
      const computed = crypto
        .createHmac("sha256", secret)
        .update(bodyBuffer)
        .digest("hex");

      // Accept either full hex or prefixed formats (e.g., sha256=...)
      const provided = signatureHeader.includes("=")
        ? signatureHeader.split("=")[1]!
        : signatureHeader;

      if (
        !crypto.timingSafeEqual(
          Buffer.from(computed, "hex"),
          Buffer.from(provided, "hex")
        )
      ) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid signature");
      }
    }

    // Parse payload
    const payload = rawBody
      ? JSON.parse(bodyBufferToString(rawBody))
      : req.body;

    // Delegate to order ingestion service
    const createdOrder = await zomatoOrderToPos(payload, restaurantId);

    // Notify connected clients (order.service already broadcasts, keep here for redundancy)
    try {
      broadcastToRestaurant(restaurantId, {
        type: "NEW_ORDER_ZOMATO",
        payload: createdOrder,
      });
    } catch (e) {
      console.warn("Websocket broadcast failed (non-fatal):", e);
    }

    res.status(200).json({ success: true });
  } catch (err) {
    if (err instanceof ApiError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    console.error("Zomato webhook processing error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

function bodyBufferToString(buf: Buffer) {
  return buf.toString("utf8");
}
