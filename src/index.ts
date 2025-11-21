// src/index.ts
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import config from "./config/index.js";
import { createServer } from "http";
import { setupWebSocket } from "./websocketServer.js";
import logger from "./config/logger.js";
import { initializeExpenseCronJobs } from "./utils/cronJobs.js";

const server = createServer(app);

setupWebSocket(server);

// Initialize expense automation cron jobs
initializeExpenseCronJobs();

server.listen(config.port, () => {
  logger.info(`🚀 Server is running on port ${config.port}`);
});
