import { PrismaClient } from "@prisma/client";

// Control Prisma logs via env flags; default to suppress verbose query logs
const LOG_QUERIES = process.env.PRISMA_LOG_QUERIES === "true";
const LOG_INFO = process.env.PRISMA_LOG_INFO === "true";

const prisma = new PrismaClient({
  log: [
    ...(LOG_QUERIES ? (["query"] as const) : []),
    ...(LOG_INFO ? (["info"] as const) : []),
    "warn",
    "error",
  ],
});

export default prisma;
