// src/websocketServer.ts
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import jwt from "jsonwebtoken";
import config from "./config/index.js";
import { UserRole } from "@prisma/client";

interface AuthenticatedWebSocket extends WebSocket {
  userId: string;
  role: UserRole;
  restaurantId: string;
}

const clients = new Map<string, AuthenticatedWebSocket>();

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket, req) => {
    const token = req.url?.split("token=")[1];

    if (!token) {
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

      ws.on("close", () => {
        clients.delete(decoded.id);
      });
    } catch (error) {
      ws.close(1008, "Invalid token");
    }
  });

  console.log("🚀 WebSocket server is running");
};

export const broadcastToRestaurant = (
  restaurantId: string,
  message: object
) => {
  const messageString = JSON.stringify(message);
  for (const [_, client] of clients) {
    if (
      client.restaurantId === restaurantId &&
      client.readyState === WebSocket.OPEN
    ) {
      client.send(messageString);
    }
  }
};
