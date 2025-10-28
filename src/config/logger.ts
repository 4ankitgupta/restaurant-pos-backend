import winston from "winston";
import config from "./index.js"; // Assuming your config file exports NODE_ENV

const { combine, timestamp, printf, uncolorize, json, colorize, simple } =
  winston.format;

const isProduction = config.jwt.nodeEnv === "production";

// Define different transports for development and production
const transports = [];

// In development, log to the console with colors and a simple format
if (!isProduction) {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    })
  );
} else {
  // In production, log to files in a structured JSON format
  // This makes it easy for log management tools to parse.

  // Log all 'info' level and above to a combined log
  transports.push(
    new winston.transports.File({
      filename: "logs/combined.log",
      level: "info",
      format: combine(timestamp(), json()),
    })
  );

  // Log all 'error' level to a separate error log
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: combine(timestamp(), json()),
    })
  );

  // You might also still want to log to the console in production
  // but with a machine-readable format (JSON)
  transports.push(
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  // Set the default level. Only logs at this level or higher will be output.
  level: isProduction ? "info" : "debug",
  format: combine(
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    })
  ),
  transports,
  // Do not exit on handled exceptions
  exitOnError: false,
});

// Create a stream object with a 'write' function that can be used by morgan
export const morganStream = {
  write: (message: string) => {
    // Use the 'http' log level so you can filter out request logs
    logger.http(message.trim());
  },
};

export default logger;
