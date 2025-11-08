// src/websocketServer.ts
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import config from "./config/index.js";
import { UserRole } from "@prisma/client";
import logger from "./config/logger.js";

interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  role: UserRole;
  restaurantId: string;
}

const clients = new Map<string, AuthenticatedWebSocket>();

// Debug helpers
const getTotalClientCount = () => clients.size;
const getRestaurantClientCount = (restaurantId: string) => {
  let count = 0;
  for (const [, client] of clients) {
    if (client.restaurantId === restaurantId) count++;
  }
  return count;
};

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, req) => {
    const url = req.url || "";
    const token = url.split("token=")[1];

    logger.info(
      `WS: Incoming connection url=${url} ip=${req.socket.remoteAddress}`
    );

    if (!token) {
      logger.warn("WS: Connection rejected - token missing");
      ws.close(1008, "Token required");
      return;
    }

    try {
      const decoded = jwt.verify(
        token,
        config.jwt.accessTokenSecret
      ) as jwt.JwtPayload;

      const authenticatedWs = ws as AuthenticatedWebSocket;
      authenticatedWs.userId = decoded.id;
      authenticatedWs.role = decoded.role;
      authenticatedWs.restaurantId = decoded.restaurantId;

      clients.set(decoded.id, authenticatedWs);

      logger.info(
        `WS: Connected userId=${decoded.id} role=${decoded.role} restaurantId=${
          decoded.restaurantId
        } totalClients=${getTotalClientCount()} restaurantClients=${getRestaurantClientCount(
          decoded.restaurantId
        )}`
      );

      ws.on("close", (code: number, reason: Buffer) => {
        clients.delete(decoded.id);
        const reasonText = reason?.toString() || "";
        logger.warn(
          `WS: Disconnected userId=${
            decoded.id
          } code=${code} reason=${reasonText} totalClients=${getTotalClientCount()} restaurantClients=${getRestaurantClientCount(
            decoded.restaurantId
          )}`
        );
      });

      ws.on("error", (err) => {
        logger.error(
          `WS: Error for userId=${decoded.id} restaurantId=${
            decoded.restaurantId
          }: ${(err as any)?.message || err}`
        );
      });
    } catch (error) {
      logger.error(
        `WS: Connection rejected - invalid token. url=${url} error=${
          (error as any)?.message
        }`
      );
      ws.close(1008, "Invalid token");
    }
  });

  wss.on("error", (err) => {
    logger.error(`WS: Server error: ${(err as any)?.message || err}`);
  });

  logger.info("🚀 WebSocket server is running");
};

export const broadcastToRestaurant = (
  restaurantId: string,
  message: object
) => {
  const messageString = JSON.stringify(message);
  const type = (message as any)?.type ?? "UNKNOWN";
  const payload = (message as any)?.payload;
  const orderId = payload?.id || payload?.orderId || "n/a";
  const recipients = [] as AuthenticatedWebSocket[];

  for (const [, client] of clients) {
    if (
      client.restaurantId === restaurantId &&
      client.readyState === WebSocket.OPEN
    ) {
      recipients.push(client);
    }
  }

  logger.info(
    `WS: Broadcast type=${type} restaurantId=${restaurantId} orderId=${orderId} recipients=${recipients.length} size=${messageString.length}B`
  );

  for (const client of recipients) {
    try {
      client.send(messageString);
    } catch (err) {
      logger.error(
        `WS: Broadcast send failed to userId=${client.userId} restaurantId=${
          client.restaurantId
        }: ${(err as any)?.message || err}`
      );
    }
  }
};
