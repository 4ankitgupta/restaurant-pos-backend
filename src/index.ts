// src/index.ts
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import config from "./config/index.js";
import { createServer } from "http";
import { setupWebSocket } from "./websocketServer.js";

const server = createServer(app);

setupWebSocket(server);

server.listen(config.port, () => {
  console.log(`🚀 Server is running on port ${config.port}`);
});
