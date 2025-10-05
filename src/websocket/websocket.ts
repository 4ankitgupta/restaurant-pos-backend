// src/websocket/websocket.ts

import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";
import config from "../config/index.js";

interface CustomWebSocket extends WebSocket {
  userId?: string;
  restaurantId?: string;
}

const wss = new WebSocketServer({ noServer: true });

const rooms: Map<string, Set<CustomWebSocket>> = new Map();

wss.on("connection", (ws: CustomWebSocket, req) => {
  const token = req.url?.split("token=")[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, config.jwt.accessTokenSecret) as any;
      ws.userId = decoded.id;
      ws.restaurantId = decoded.restaurantId;

      const roomName = `restaurant:${ws.restaurantId}`;
      if (!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
      }
      rooms.get(roomName)?.add(ws);

      ws.on("close", () => {
        rooms.get(roomName)?.delete(ws);
      });
    } catch (error) {
      ws.close();
    }
  } else {
    ws.close();
  }
});

export const broadcastToRoom = (
  roomName: string,
  type: string,
  payload: any
) => {
  const room = rooms.get(roomName);
  if (room) {
    const message = JSON.stringify({ type, payload });
    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

export default wss;
