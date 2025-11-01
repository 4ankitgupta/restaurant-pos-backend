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
      // 1. Model Whitelist: Only allow querying safe, known models.
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
