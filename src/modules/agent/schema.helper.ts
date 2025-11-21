/**
 * Schema Helper - Generates a minimized, AI-friendly database schema description
 *
 * This removes sensitive fields and provides a cleaner, more token-efficient
 * representation of the database structure for the AI agent.
 */

export function getMinimizedSchema(): string {
  return `
DATABASE SCHEMA (PostgreSQL)
============================

--- CORE MODELS ---

Restaurant {
  id: String (UUID)
  name: String
  email: String
  phone: String
  address: String
  isActive: Boolean
  featureFlags: JSON
  zomatoIntegrationEnabled: Boolean
}

User {
  id: String (UUID)
  name: String
  email: String
  phone: String
  role: UserRole (ADMIN | MANAGER | CASHIER | WAITER | KITCHEN_STAFF)
  isActive: Boolean
  restaurantId: String (FK -> Restaurant)
}

--- MENU MODELS ---

MenuCategory {
  id: String (UUID)
  name: String
  description: String
  restaurantId: String (FK -> Restaurant)
}

MenuItem {
  id: String (UUID)
  name: String
  description: String
  isAvailable: Boolean
  restaurantId: String (FK -> Restaurant)
  categoryId: String (FK -> MenuCategory)
  Relation: variants[] -> MenuItemVariant
}

MenuItemVariant {
  id: String (UUID)
  name: String
  price: Decimal
  isAvailable: Boolean
  menuItemId: String (FK -> MenuItem)
  restaurantId: String (FK -> Restaurant)
}

--- TABLE & ORDER MODELS ---

Table {
  id: String (UUID)
  tableNumber: String
  capacity: Int
  status: TableStatus (Available | Occupied | Reserved | NeedCleaning)
  restaurantId: String (FK -> Restaurant)
}

Order {
  id: String (UUID)
  status: OrderStatus (PENDING | IN_PROGRESS | COMPLETED | CANCELLED)
  totalAmount: Decimal
  paymentStatus: PaymentStatus (UNPAID | PAID | PARTIAL | REFUNDED)
  orderType: OrderType (DINE_IN | TAKE_AWAY | DELIVERY_ZOMATO | DELIVERY_SWIGGY | DELIVERY_OTHER)
  sourceId: String (external order ID)
  customerName: String
  customerPhone: String
  deliveryAddress: String
  takeAway: Boolean
  createdAt: DateTime
  updatedAt: DateTime
  restaurantId: String (FK -> Restaurant)
  tableId: String (FK -> Table, nullable)
  userId: String (FK -> User, nullable)
  Relation: orderItems[] -> OrderItem
  Relation: payments[] -> Payment
}

OrderItem {
  id: String (UUID)
  quantity: Int
  price: Decimal
  status: OrderItemStatus (ORDERED | PREPARING | PREPARED | SERVED | CANCELLED)
  paymentStatus: OrderItemPaymentStatus (UNPAID | PAID)
  note: String
  createdAt: DateTime
  updatedAt: DateTime
  restaurantId: String (FK -> Restaurant)
  orderId: String (FK -> Order)
  menuItemVariantId: String (FK -> MenuItemVariant, nullable)
}

Payment {
  id: String (UUID)
  amount: Decimal
  tenderedAmount: Decimal
  changeAmount: Decimal
  paymentMethod: PaymentMethod (CASH | CARD | UPI | WALLET)
  status: TransactionStatus (SUCCESS | FAILED | PENDING)
  transactionId: String
  coveredItems: JSON
  createdAt: DateTime
  restaurantId: String (FK -> Restaurant)
  orderId: String (FK -> Order)
}

--- INVENTORY MODELS ---

InventoryItem {
  id: String (UUID)
  name: String
  unit: String (kg, liter, piece, etc.)
  currentStock: Float
  reorderLevel: Float
  lastUpdated: DateTime
  createdAt: DateTime
  restaurantId: String (FK -> Restaurant)
  Relation: purchaseItems[] -> PurchaseItem
  Relation: stockLogs[] -> StockLog
}

Supplier {
  id: String (UUID)
  name: String
  contactPerson: String
  phone: String
  email: String
  address: String
  restaurantId: String (FK -> Restaurant)
}

PurchaseOrder {
  id: String (UUID)
  invoiceNumber: String
  totalAmount: Float
  purchaseDate: DateTime
  createdAt: DateTime
  restaurantId: String (FK -> Restaurant)
  supplierId: String (FK -> Supplier)
  Relation: purchaseItems[] -> PurchaseItem
}

PurchaseItem {
  id: String (UUID)
  quantity: Float
  unitPrice: Float
  totalPrice: Float
  restaurantId: String (FK -> Restaurant)
  purchaseOrderId: String (FK -> PurchaseOrder)
  inventoryItemId: String (FK -> InventoryItem)
}

StockLog {
  id: String (UUID)
  changeType: StockChangeType (ADD | REMOVE | ADJUST | WASTAGE | USAGE)
  quantity: Float
  remarks: String
  createdAt: DateTime
  restaurantId: String (FK -> Restaurant)
  inventoryItemId: String (FK -> InventoryItem)
  purchaseOrderId: String (FK -> PurchaseOrder, nullable)
}

--- EXPENSE MODELS ---

ExpenseCategory {
  id: String (UUID)
  name: String
  description: String
  color: String (hex code)
  restaurantId: String (FK -> Restaurant)
}

Expense {
  id: String (UUID)
  description: String
  amount: Decimal
  expenseDate: DateTime
  status: ExpenseStatus (PENDING | PAID | OVERDUE)
  paymentMethod: PaymentMethod (CASH | CARD | UPI | WALLET)
  paidBy: String
  referenceNo: String
  attachmentUrl: String
  isRecurring: Boolean
  restaurantId: String (FK -> Restaurant)
  categoryId: String (FK -> ExpenseCategory, nullable)
  createdAt: DateTime
  updatedAt: DateTime
}

RecurringExpense {
  id: String (UUID)
  name: String
  amount: Decimal
  interval: RecurrenceInterval (DAILY | WEEKLY | MONTHLY | QUARTERLY | YEARLY)
  startDate: DateTime
  nextRunDate: DateTime
  isActive: Boolean
  autoGenerate: Boolean
  restaurantId: String (FK -> Restaurant)
  categoryId: String (FK -> ExpenseCategory, nullable)
}

--- EMPLOYEE & ATTENDANCE MODELS ---

Employee {
  id: String (UUID)
  name: String
  employeeCode: String
  biometricId: String
  isActive: Boolean
  createdAt: DateTime
  updatedAt: DateTime
  restaurantId: String (FK -> Restaurant)
  userId: String (FK -> User, nullable)
  Relation: attendancePunches[] -> AttendancePunch
}

AttendancePunch {
  id: String (UUID)
  timestamp: DateTime
  type: PunchType (IN | OUT)
  source: String
  restaurantId: String (FK -> Restaurant)
  employeeId: String (FK -> Employee)
}

--- CHAT MODELS ---

Conversation {
  id: String (UUID)
  createdAt: DateTime
  updatedAt: DateTime
  restaurantId: String (FK -> Restaurant)
  userId: String (FK -> User)
  Relation: messages[] -> ChatMessage
}

ChatMessage {
  id: String (UUID)
  role: ChatMessageRole (USER | AI)
  content: String
  createdAt: DateTime
  conversationId: String (FK -> Conversation)
}

--- IMPORTANT QUERY RULES ---
1. All table and column names in SQL queries MUST be wrapped in double-quotes
   Example: SELECT "name", "price" FROM "MenuItem" WHERE "restaurantId" = $1

2. Always filter by restaurantId using the $1 placeholder in SQL queries
   Example: WHERE "restaurantId" = $1

3. For relations, use include in Prisma queries or JOINs in SQL
   Example (Prisma): include: { table: true, orderItems: true }
   Example (SQL): LEFT JOIN "Table" t ON o."tableId" = t."id"

4. Use proper date filtering for time-based queries
   Example: WHERE "createdAt" >= '2024-01-01' AND "createdAt" < '2024-02-01'
`;
}
