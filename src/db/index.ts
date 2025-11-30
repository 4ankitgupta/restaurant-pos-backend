import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Control Prisma logs via env flags; default to suppress verbose query logs
const LOG_QUERIES = process.env.PRISMA_LOG_QUERIES === "true";
const LOG_INFO = process.env.PRISMA_LOG_INFO === "true";

// Create PostgreSQL connection pool
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: [
    ...(LOG_QUERIES ? (["query"] as const) : []),
    ...(LOG_INFO ? (["info"] as const) : []),
    "warn",
    "error",
  ],
});

export default prisma;
