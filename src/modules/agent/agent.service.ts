import { ChatGroq } from "@langchain/groq";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
// import { AgentExecutor, createOpenAIToolsAgent } from "langchain/core/agents";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import config from "../../config/index.js";
import prisma from "../../db/index.js";
import { createPrismaTool, createRawSqlTool } from "./agent.tools.js";
import {
  createSalesAnalyticsTool,
  createInventoryTool,
  createPopularItemsTool,
} from "./new_analytics.tools.js";
import { createKnowledgeBaseTool } from "./knowledge.tools.js";
import { getMinimizedSchema } from "./schema.helper.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

// --- Get the minimized schema (token-efficient) ---
const MINIMIZED_SCHEMA = getMinimizedSchema();

// --- Updated System Prompt (Token-efficient) ---
const SYSTEM_PROMPT = `You are "Rasoi AI", a helpful assistant for restaurant owners and staff.
You must be polite, professional, and helpful. You can respond in English or Hindi based on the user's language.

**CRITICAL RULES:**
1. **NEVER BE TECHNICAL**: Do not mention "tools", "database", "tables", "SQL", "queries", "schemas", or technical field names.
2. **PRESENT DATA CLEANLY**: Never show UUIDs or technical IDs. Summarize information in a user-friendly way.
3. **BE HONEST**: If you cannot find information, say so. Do not make up data.
4. **CLARIFY WHEN NEEDED**: If a request is unclear, ask for clarification in simple language.

**YOUR CAPABILITIES:**
- Answer questions about sales, revenue, orders, payments
- Check inventory levels and low stock items
- Find popular menu items and analyze trends
- Look up employee, table, and order information
- Provide how-to guides for using the platform
- Analyze data across any date range

**DATABASE TOOLS:**
You have access to tools for querying the restaurant's data:
- \`restaurant_database_query\`: For simple lookups (e.g., "show menu items", "find table 5"). Use \`include\` for related data.
- \`execute_sql_query\`: For complex analytics requiring joins/aggregations. Always use $1 for restaurantId. Wrap names in double-quotes.
- \`get_sales_analytics\`: For sales/revenue analysis across any date range
- \`check_inventory_status\`: For inventory checks and low stock items
- \`get_popular_items\`: For top-selling item analysis
- \`search_help_guide\`: For "how-to" questions about using the platform

**DATABASE SCHEMA:**
${MINIMIZED_SCHEMA}

**QUERY EXAMPLES:**
- Simple: Use restaurant_database_query with { model: "Order", query: { where: { tableId: "..." }, include: { table: true } } }
- Complex SQL: SELECT "name", SUM("totalAmount") FROM "Order" WHERE "restaurantId" = $1 GROUP BY "name"
- Always filter by restaurantId in SQL queries using $1 placeholder
`;

export async function getAgentResponse(params: {
  message: string;
  conversationId?: string;
  userId: string;
  restaurantId: string;
}) {
  const { message, userId, restaurantId } = params;
  let { conversationId } = params;

  // 1️⃣ Initialize Model (Using Llama 3.1 70B for better SQL understanding)
  const model = new ChatGroq({
    apiKey: config.jwt.GROQ_API_KEY,
    model: "openai/gpt-oss-20b", // Better for SQL generation and complex reasoning
    temperature: 0.1, // Lower temperature for more consistent, factual responses
  });

  // 2️⃣ Initialize Tools (New Universal Tools)
  const tools = [
    // Core database tools
    createPrismaTool(restaurantId), // Updated with include support
    createRawSqlTool(restaurantId), // Updated to allow CTEs

    // Universal analytics tools (replace old rigid tools)
    createSalesAnalyticsTool(restaurantId), // Flexible date range sales analysis
    createInventoryTool(restaurantId), // Universal inventory checks
    createPopularItemsTool(restaurantId), // Top items for any date range

    // Knowledge base for how-to questions
    createKnowledgeBaseTool(), // Static RAG for platform help
  ];

  // 3️⃣ Create or Fetch Chat History
  const chatHistory: BaseMessage[] = [];

  if (conversationId) {
    // Fetch existing conversation
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: 5,
    });
    messages.forEach((msg) => {
      if (msg.role === "USER") chatHistory.push(new HumanMessage(msg.content));
      else chatHistory.push(new AIMessage(msg.content));
    });
  }

  // 4️⃣ Create LangGraph Agent with system message
  const agent = await createReactAgent({
    llm: model,
    tools,
    messageModifier: SYSTEM_PROMPT,
  });

  // 6️⃣ Invoke Agent with messages state
  const result = await agent.invoke({
    messages: [...chatHistory, new HumanMessage(message)],
  });

  // 7️⃣ Extract the final answer
  const finalMessage =
    Array.isArray(result.messages) && result.messages.length > 0
      ? result.messages[result.messages.length - 1]
      : new AIMessage("Sorry, I encountered an issue.");

  const aiResponse =
    finalMessage && typeof finalMessage.content === "string"
      ? finalMessage.content
      : "No valid response generated.";

  // 8️⃣ Save Conversation + Messages
  if (!conversationId) {
    const conversation = await prisma.conversation.create({
      data: { userId, restaurantId },
    });
    conversationId = conversation.id;
  }

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "USER",
      content: message,
    },
  });

  await prisma.chatMessage.create({
    data: {
      conversationId,
      role: "AI",
      content: aiResponse,
    },
  });

  // 9️⃣ Return Response
  return {
    response: aiResponse,
    conversationId: conversationId,
  };
}

// --- List Conversations (no changes) ---
export async function listConversations(userId: string, restaurantId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { userId, restaurantId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return conversations.map((convo) => ({
    id: convo.id,
    title: convo.messages[0]?.content || "New Chat",
    updatedAt: convo.updatedAt,
  }));
}

// --- Get Messages (no changes) ---
export async function getMessagesByConversationId(
  conversationId: string,
  restaurantId: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, restaurantId: restaurantId },
  });

  if (!conversation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
  }

  const messages = await prisma.chatMessage.findMany({
    where: { conversationId: conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return messages;
}

// --- Delete Conversation ---
export async function deleteConversation(
  conversationId: string,
  restaurantId: string
) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, restaurantId: restaurantId },
  });

  if (!conversation) {
    throw new ApiError(httpStatus.NOT_FOUND, "Conversation not found");
  }

  // Delete all messages in the conversation first (cascade delete)
  await prisma.chatMessage.deleteMany({
    where: { conversationId: conversationId },
  });

  // Delete the conversation
  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  return { success: true, message: "Conversation deleted successfully" };
}
