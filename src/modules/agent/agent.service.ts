import { ChatGroq } from "@langchain/groq";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import config from "../../config/index.js";
import prisma from "../../db/index.js";
import { createPrismaTool, createPlatformHelpTool } from "./agent.tools.js";

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
    model: "llama3-70b-8192",
    temperature: 0.2,
  });

  // 2️⃣ Initialize Tools
  const tools = [createPrismaTool(restaurantId), createPlatformHelpTool()];

  // 3️⃣ Fetch Chat History
  const chatHistory: BaseMessage[] = [];
  if (conversationId) {
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
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
  ]);

  // 5️⃣ Create LangGraph Agent
  const agent = await createReactAgent({
    llm: model,
    tools,
    prompt,
  });

  // 6️⃣ Invoke Agent with messages state
  const result = await agent.invoke({
    messages: [...chatHistory, new HumanMessage(message)],
  });

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
      content:
        (result as any).messages?.[(result as any).messages.length - 1]
          ?.content ?? "",
    },
  });

  // 9️⃣ Return Final Response
  return {
    response:
      (result as any).messages?.[(result as any).messages.length - 1]
        ?.content ?? "",
    conversationId,
  };
}
