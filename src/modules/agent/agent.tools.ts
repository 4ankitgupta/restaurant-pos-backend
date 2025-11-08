import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import prisma from "../../db/index.js";

/**
 * Creates the "backup" tool that can run dynamic, safe Prisma queries.
 * @param restaurantId The ID of the restaurant, enforced in all queries.
 */
export function createPrismaTool(restaurantId: string) {
  // We define the *input schema* for the AI using Zod.
  // The AI *must* provide an object matching this structure.
  const schema = z.object({
    model: z
      .string()
      .describe(
        'The Prisma model to query, e.g., "Order", "MenuItem", "InventoryItem"'
      ),
    query: z
      .object({
        where: z.any().optional().describe('The "where" clause for filtering'),
        select: z.any().optional().describe('The "select" clause for fields'),
        orderBy: z
          .any()
          .optional()
          .describe('The "orderBy" clause for sorting'),
        take: z.number().optional().describe("Limit results. Default is 20."),
      })
      .describe("The Prisma query object"),
  });

  return new DynamicStructuredTool({
    name: "restaurant_database_query",
    description:
      'Use this tool to query the restaurant database. You must provide a valid Prisma query JSON object. Do not use this for "how-to" questions.',
    schema: schema,
    func: async ({ model, query }) => {
      // **SECURITY CHECKS**
      // 1. Model Whitelist: Only allow querying safe, known models. node prisma/seed.js
      const allowedModels = [
        "Order",
        "MenuItem",
        "MenuCategory",
        "MenuItemVariant",
        "Table",
        "OrderItem",
        "StockLog",
        "Supplier",
        "PurchaseOrder",
        "PurchaseItem",
        "Expense",
        "InventoryItem",
        "Payment",
        "User",
        "Table",
        "AttendancePunch",
        "Employee",
      ];
      const client: any = prisma as any;
      if (
        !model ||
        !allowedModels.includes(model as string) ||
        !client[model]
      ) {
        return `Error: Invalid or disallowed model: ${model}. You can only query: ${allowedModels.join(
          ", "
        )}`;
      }

      try {
        // 2. Tenancy Enforcement: Force the restaurantId into every query.
        const secureQuery = {
          ...query,
          where: {
            ...query.where,
            restaurantId: restaurantId, // <-- THIS IS THE SECURITY GATE
          },
          take: query.take || 20, // Default limit
        };

        // 3. Read-Only: We only call 'findMany'.
        const results = await (client[model] as any).findMany(secureQuery);

        if (results.length === 0) {
          return "No results found.";
        }

        return JSON.stringify(results, null, 2);
      } catch (error) {
        // This catches errors if the AI generates a bad query (e.g., bad field)
        const message = error instanceof Error ? error.message : String(error);
        return `Error executing query: ${message}. Check your 'where' and 'select' clauses for valid fields.`;
      }
    },
  });
}

// --- NEW TOOL ---
/**
 * Creates a tool for executing advanced, read-only raw SQL queries.
 * @param restaurantId The ID of the restaurant, enforced as a parameter.
 */
export function createRawSqlTool(restaurantId: string) {
  return new DynamicStructuredTool({
    name: "execute_sql_query",
    description:
      'Use this tool for complex, read-only SQL queries that require joins, aggregations, or subqueries (e.g., "who is present today?", "total sales this week").',
    schema: z.object({
      query: z
        .string()
        .describe(
          'The raw PostgreSQL SELECT statement. You MUST use $1 as the placeholder for the restaurantId (e.g., WHERE "restaurantId" = $1).'
        ),
    }),
    func: async ({ query }) => {
      // **SECURITY CHECKS**
      // 1. Basic check for read-only
      if (!query.trim().toLowerCase().startsWith("select")) {
        return "Error: Only SELECT statements are allowed.";
      }

      // 2. Check for keywords that could modify data or schema
      const forbiddenKeywords = [
        "drop",
        "delete",
        "update",
        "insert",
        "truncate",
        "alter",
        "create",
        "exec",
        "grant",
        "revoke",
      ];
      const lowerQuery = query.toLowerCase();
      if (forbiddenKeywords.some((k) => lowerQuery.includes(k))) {
        return `Error: Query contains forbidden keywords. Only SELECT statements are allowed.`;
      }

      // 3. Ensure the restaurantId parameter is used
      if (!query.includes("$1")) {
        return 'Error: Your query MUST include a $1 placeholder for the "restaurantId".';
      }

      try {
        // 4. Parameterized Query: We pass the restaurantId as a separate
        // argument to prevent SQL injection.
        const results = await prisma.$queryRawUnsafe(query, restaurantId);

        if (!Array.isArray(results) || results.length === 0) {
          return "No results found.";
        }

        return JSON.stringify(results, null, 2);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error executing query: ${message}. Check your SQL syntax and table/column names.`;
      }
    },
  });
}

/**
 * Creates a simple RAG tool for platform help.
 */
export function createPlatformHelpTool() {
  return new DynamicStructuredTool({
    name: "platform_help_tool",
    description:
      'Use this tool to answer general "how-to" questions about the platform, like "How do I add a menu item?" or "How do I create an order?".',
    schema: z.object({
      question: z.string().describe("The user's help question"),
    }),
    func: async ({ question }) => {
      // For now, we return a static answer.
      // TODO: Implement RAG here.
      console.log(`Help tool was asked: ${question}`);
      return "I can only access database information right now. For help with the platform, please see the user manual.";
    },
  });
}
