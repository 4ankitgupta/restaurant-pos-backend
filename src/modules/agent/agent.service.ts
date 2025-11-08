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
import {
  createPrismaTool,
  createPlatformHelpTool,
  createRawSqlTool, // --- ADD THIS IMPORT ---
} from "./agent.tools.js";
import { ApiError } from "../../utils/ApiError.js";
import httpStatus from "http-status";

// --- NEW: Add the entire Prisma Schema here ---
const PRISMA_SCHEMA = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  MANAGER
  CASHIER
  WAITER
  KITCHEN_STAFF
}

model Restaurant {
  id              String            @id @default(uuid())
  name            String
  email           String?           @unique
  phone           String?
  address         String?
  isActive        Boolean           @default(true)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  subscription    Subscription?
  users           User[]
  menuCategories  MenuCategory[]
  menuItems       MenuItem[]
  variants        MenuItemVariant[]
  tables          Table[]
  orders          Order[]
  orderItems      OrderItem[]
  payments        Payment[]
  inventoryItems  InventoryItem[]
  purchaseOrders  PurchaseOrder[]
  purchaseItems   PurchaseItem[]
  suppliers       Supplier[]
  expenses        Expense[]
  stockLogs       StockLog[]
  conversations   Conversation[]
  employees         Employee[]
  attendancePunches AttendancePunch[]
}

model User {
  id            String     @id @default(uuid())
  name          String
  email         String     @unique
  phone         String?
  passwordHash  String
  role          UserRole
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId  String
  orders        Order[]
  conversations Conversation[]
  employee      Employee?
}

model MenuCategory {
  id            String     @id @default(uuid())
  name          String
  description   String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId  String
  menuItems     MenuItem[]
}

model MenuItem {
  id              String        @id @default(uuid())
  name            String
  description     String?
  isAvailable     Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  restaurant      Restaurant    @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId    String
  category        MenuCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  categoryId      String?
  variants        MenuItemVariant[]
}
model MenuItemVariant {
  id           String    @id @default(uuid())
  name         String 
  price        Decimal
  isAvailable  Boolean   @default(true)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  menuItem     MenuItem  @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  menuItemId   String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId String
  orderItems   OrderItem[]
}

enum TableStatus {
  Available
  Occupied
  Reserved
  NeedCleaning
}

model Table {
  id           String      @id @default(uuid())
  tableNumber  String
  capacity     Int
  status       TableStatus @default(Available)
  restaurant   Restaurant  @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId String
  orders       Order[]
}

enum OrderStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum OrderItemStatus {
  ORDERED
  PREPARING
  PREPARED
  SERVED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PAID
  PARTIAL
  REFUNDED
}

model Order {
  id            String        @id @default(uuid())
  status        OrderStatus   @default(PENDING)
  totalAmount   Decimal       @default(0.0)
  paymentStatus PaymentStatus @default(UNPAID)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  takeAway      Boolean       @default(false)
  restaurant    Restaurant    @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId  String
  table         Table?        @relation(fields: [tableId], references: [id])
  tableId       String?
  user          User?         @relation(fields: [userId], references: [id], onDelete: SetNull)
  userId        String?
  orderItems    OrderItem[]
  payments      Payment[]
}

model OrderItem {
  id           String          @id @default(uuid())
  quantity     Int
  price        Decimal
  status       OrderItemStatus @default(ORDERED)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  note         String? 
  restaurant   Restaurant      @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId String
  order        Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId      String
  menuItemVariant   MenuItemVariant? @relation(fields: [menuItemVariantId], references: [id], onDelete: SetNull)
  menuItemVariantId String?
}

enum PaymentMethod {
  CASH
  CARD
  UPI
  WALLET
}

enum TransactionStatus {
  SUCCESS
  FAILED
  PENDING
}

model Payment {
  id             String            @id @default(uuid())
  amount         Decimal
  paymentMethod  PaymentMethod
  status         TransactionStatus @default(SUCCESS)
  transactionId  String?
  createdAt      DateTime          @default(now())
  restaurant     Restaurant        @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId   String
  order          Order             @relation(fields: [orderId], references: [id], onDelete:Cascade)
  orderId        String
}

model InventoryItem {
  id            String         @id @default(uuid())
  name          String
  unit          String // e.g., kg, liter, piece
  currentStock  Float          @default(0)
  reorderLevel  Float          @default(0)
  lastUpdated   DateTime       @updatedAt
  restaurant    Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId  String
  purchaseItems PurchaseItem[]
  stockLogs     StockLog[]
  createdAt     DateTime       @default(now())
}

model Supplier {
  id            String          @id @default(uuid())
  name          String
  contactPerson String?
  phone         String?
  email         String?
  address       String?
  restaurant    Restaurant      @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId  String
  purchaseOrders PurchaseOrder[]
  createdAt     DateTime        @default(now())
}

model PurchaseOrder {
  id            String         @id @default(uuid())
  supplier      Supplier       @relation(fields: [supplierId], references: [id])
  supplierId    String
  restaurant    Restaurant     @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId  String
  invoiceNumber String?
  totalAmount   Float
  purchaseDate  DateTime       @default(now())
  purchaseItems PurchaseItem[]
  createdAt     DateTime       @default(now())
  stockLogs       StockLog[]
}

model PurchaseItem {
  id              String        @id @default(uuid())
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  purchaseOrderId String
  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id])
  inventoryItemId String
  quantity        Float
  unitPrice       Float
  totalPrice      Float
  restaurant      Restaurant    @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId    String
}

enum StockChangeType {
  ADD
  REMOVE
  ADJUST
  WASTAGE
  USAGE
}

model StockLog {
  id              String          @id @default(uuid())
  restaurant      Restaurant      @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId    String
  inventoryItem   InventoryItem   @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  inventoryItemId String
  changeType      StockChangeType
  quantity        Float
  remarks         String?
  purchaseOrder   PurchaseOrder?  @relation(fields: [purchaseOrderId], references: [id])
  purchaseOrderId String?
  createdAt       DateTime        @default(now())
}

model Expense {
  id           String     @id @default(uuid())
  description  String
  amount       Decimal
  expenseDate  DateTime
  createdAt    DateTime   @default(now())
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId String
}

model SuperAdmin {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Plan {
  id            String         @id @default(uuid())
  name          String
  price         Decimal
  features      Json?
  subscriptions Subscription[]
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
}

model Subscription {
  id             String             @id @default(uuid())
  restaurant     Restaurant         @relation(fields: [restaurantId], references: [id])
  restaurantId   String             @unique
  plan           Plan               @relation(fields: [planId], references: [id])
  planId         String
  status         SubscriptionStatus @default(TRIAL)
  trialEndsAt    DateTime?
  nextBillingDate DateTime?
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt
}

model Announcement {
  id          String   @id @default(uuid())
  title       String
  content     String
  publishedAt DateTime @default(now())
}

model SystemSetting {
  key         String @id @unique
  value       Json
  description String?
}

model Conversation {
  id           String     @id @default(uuid())
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId       String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  messages     ChatMessage[]
  @@index([userId])
  @@index([restaurantId])
}

enum ChatMessageRole {
  USER
  AI
}

model ChatMessage {
  id             String       @id @default(uuid())
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  conversationId String
  role           ChatMessageRole
  content        String       @db.Text
  createdAt      DateTime     @default(now())
  @@index([conversationId])
}

enum PunchType {
  IN
  OUT
}

model Employee {
  id            String     @id @default(uuid())
  name          String
  employeeCode  String
  biometricId   String?
  isActive      Boolean    @default(true)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  restaurant    Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId  String
  user          User?      @relation(fields: [userId], references: [id], onDelete: SetNull)
  userId        String?    @unique
  attendancePunches AttendancePunch[]
  @@unique([restaurantId, employeeCode])  
  @@unique([restaurantId, biometricId])
  @@index([userId])
}

model AttendancePunch {
  id          String     @id @default(uuid())
  timestamp   DateTime   @default(now())
  type        PunchType
  source      String?
  employee    Employee   @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  employeeId  String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  restaurantId String
  @@index([employeeId, timestamp])
}
`;

// --- NEW: Updated System Prompt ---
const SYSTEM_PROMPT = `You are a helpful assistant for a restaurant owner.
Your name is "Rasoi AI".
You must be polite, professional, and helpful.
You must answer in both English and Hindi, based on the user's language.

You have access to internal tools to query the restaurant's database.

**--- CRITICAL OPERATING RULES ---**
1.  **DO NOT BE TECHNICAL:** You must **NEVER** discuss your internal workings.
    * Do not mention that you are using "tools."
    * Do not mention "database," "tables," "models," "schemas," "SQL," or "queries."
    * Do not mention specific database field names (like 'isPresent' or 'attendanceStatus').

2.  **PRESENT DATA CLEANLY:** When you get information, present it in a simple, user-friendly format.
    * **NEVER** show technical identifiers like UUIDs or database keys.
    * Summarize the information clearly.

3.  **HANDLE AMBIGUOUS REQUESTS GRACEFULLY:**
    * If a user asks for information and you cannot find it (even after trying to query), do **NOT** ask them for database details.
    * Instead, state that you don't have access to that specific information (e.g., "I can look up employee profiles, but I don't have access to today's live attendance records.")
    * If the request is unclear, ask for clarification in simple, non-technical language.

4.  **STICK TO FACTS:** Do not make up information you cannot find.

**--- DATABASE QUERY RULES ---**
1.  You have two tools to get information:
    * \`restaurant_database_query\`: Use this for simple requests about one topic (e.g., "list all menu items", "find an employee named 'Ramesh'").
    * \`execute_sql_query\`: Use this for complex requests that require combining information (e.g., "who is present today?", "what are the total sales for this week?", "top 5 selling items").

2.  When using \`execute_sql_query\`, you must write a raw, read-only PostgreSQL query.
    * **IMPORTANT:** You MUST include a \`WHERE\` clause to filter by the restaurant's ID using the \`$1\` placeholder.
    * Example: \`SELECT "name" FROM "Employee" WHERE "restaurantId" = $1 AND "isActive" = true\`.
    * All table and column names must be wrapped in double-quotes (e.g., "MenuItem", "totalAmount").

3.  The full database schema is provided below for you to construct your queries. You MUST use this to write correct queries.

**--- DATABASE SCHEMA ---**
${PRISMA_SCHEMA}
`;

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
    model: "openai/gpt-oss-20b", // Note: This model name seems unusual for Groq. You may want to use "llama3-70b-8192" or "gemma2-27b-it" for better SQL generation.
    temperature: 0.2,
  });

  // 2️⃣ Initialize Tools
  // --- ADD THE NEW TOOL HERE ---
  const tools = [
    createPrismaTool(restaurantId),
    createRawSqlTool(restaurantId), // <-- ADDED
    createPlatformHelpTool(),
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
