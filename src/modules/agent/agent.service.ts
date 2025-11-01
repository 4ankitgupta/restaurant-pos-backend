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
import { createPrismaTool, createPlatformHelpTool } from "./agent.tools.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

// This is the main system prompt for the agent
const SYSTEM_PROMPT = `You are a helpful assistant for a restaurant owner.
Your name is "Rasoi AI".
You must answer in both English and Hindi, based on the user's language.
You have access to tools to query the restaurant's database.
When asked for data, use your tools. When asked for help, use your knowledge.
Be polite, professional, and helpful.
If you use a tool and it returns data, present that data clearly to the user.
Do not make up information you cannot find.`;

export async function getAgentResponse(params: {
  message: string;
  conversationId?: string;
  userId: string;
  restaurantId: string;
}) {
  const { message, userId, restaurantId } = params;
  let { conversationId } = params;

  // 1️⃣ Initialize Model
  const model = new ChatGroq({
    apiKey: config.jwt.GROQ_API_KEY,
    model: "openai/gpt-oss-20b",
    temperature: 0.2,
  });

  // 2️⃣ Initialize Tools
  const tools = [createPrismaTool(restaurantId), createPlatformHelpTool()];

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

  // 4️⃣ Define Prompt
  // --- THIS IS THE FIX FOR THE 500 ERROR ---
  // We change the prompt to only use "messages"
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    new MessagesPlaceholder("messages"), // <-- WAS "chat_history" and "input"
  ]);
  // --- END OF FIX ---

  // 5️⃣ Create LangGraph Agent
  const agent = await createReactAgent({
    llm: model,
    tools,
    prompt,
  });

  // 6️⃣ Invoke Agent with messages state
  // This invoke call is now correct for the new prompt
  const result = await agent.invoke({
    messages: [...chatHistory, new HumanMessage(message)],
  });

  // 7️⃣ Extract the final answer
  // LangGraph's output is an object, the final message is in the 'messages' array.
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
      content: aiResponse, // <-- Use the extracted response
    },
  });

  // 9️⃣ Return Response
  return {
    response: aiResponse,
    conversationId: conversationId,
  };
}

// --- ADD THIS SERVICE FUNCTION ---
/**
 * Lists all conversations for a specific user and restaurant
 */
export async function listConversations(userId: string, restaurantId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { userId, restaurantId },
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
      // Get the first message as a "title"
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Format the response to be cleaner for the frontend
  return conversations.map((convo) => ({
    id: convo.id,
    title: convo.messages[0]?.content || "New Chat",
    updatedAt: convo.updatedAt,
  }));
}

// --- AND ADD THIS SERVICE FUNCTION ---
/**
 * Gets all messages for a specific conversation,
 * ensuring it belongs to the user's restaurant.
 */
export async function getMessagesByConversationId(
  conversationId: string,
  restaurantId: string
) {
  // Security check: Make sure this conversation belongs to the restaurant
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
