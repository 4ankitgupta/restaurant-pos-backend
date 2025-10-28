// src/index.ts
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import config from "./config/index.js";
import { createServer } from "http";
import { setupWebSocket } from "./websocketServer.js";
import logger from "./config/logger.js";

const server = createServer(app);

setupWebSocket(server);

server.listen(config.port, () => {
  logger.info(`🚀 Server is running on port ${config.port}`);
});
