import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * Knowledge Base for Platform Help
 * Static FAQ/How-to guide for common platform questions
 * This prevents the AI from hallucinating database queries for "how-to" questions
 */

const KNOWLEDGE_BASE: Record<string, string> = {
  // Menu Management
  "add menu item":
    "To add a menu item:\n1. Go to 'Menu' in the sidebar\n2. Click 'Add New Item'\n3. Fill in the item name, description, and select a category\n4. Add variants with names and prices (e.g., 'Small ₹100', 'Large ₹150')\n5. Click 'Save' to add the item to your menu",

  "edit menu item":
    "To edit a menu item:\n1. Go to 'Menu' in the sidebar\n2. Find the item you want to edit\n3. Click the edit (pencil) icon\n4. Update the details or variants\n5. Click 'Save' to apply changes",

  "delete menu item":
    "To delete a menu item:\n1. Go to 'Menu' in the sidebar\n2. Find the item you want to delete\n3. Click the delete (trash) icon\n4. Confirm the deletion\nNote: Deleted items cannot be ordered but remain in historical data",

  "menu category":
    "To manage menu categories:\n1. Go to 'Menu' > 'Categories'\n2. Click 'Add Category' to create a new one\n3. Name the category (e.g., 'Beverages', 'Main Course')\n4. Assign items to categories when creating or editing menu items",

  // Order Management
  "create order":
    "To create a new order:\n1. Go to 'Orders' or click 'New Order'\n2. Select a table (for dine-in) or choose 'Take Away'\n3. Add items from the menu by clicking on them\n4. Select the variant and quantity\n5. Add any special notes if needed\n6. Click 'Place Order' to send to kitchen",

  "split bill":
    "To split a bill:\n1. Open the order you want to split\n2. Click 'Split Payment' button\n3. Select which items go to which person\n4. Process each payment separately\n5. System will mark items as paid individually",

  "cancel order":
    "To cancel an order:\n1. Go to 'Orders' and find the order\n2. Click on the order to open details\n3. Click 'Cancel Order' button\n4. Confirm cancellation\nNote: Only PENDING or IN_PROGRESS orders can be cancelled",

  // Payment & Refunds
  refund:
    "To issue a refund:\n1. Go to 'Orders' > 'Completed'\n2. Find and open the order\n3. Click 'Issue Refund' at the bottom\n4. Select the payment method used\n5. Enter refund amount and reason\n6. Click 'Confirm Refund'\nNote: Refunds are recorded but don't automatically reverse card/UPI transactions",

  "payment methods":
    "Available payment methods:\n- CASH: Accept cash payment\n- CARD: Card payment (manual entry)\n- UPI: UPI payment (manual entry)\n- WALLET: Digital wallet payments\n\nTo record a payment:\n1. Open the order\n2. Click 'Add Payment'\n3. Select payment method\n4. Enter amount and confirm",

  // Table Management
  "manage tables":
    "To manage tables:\n1. Go to 'Tables' in the sidebar\n2. Click 'Add Table' to create a new table\n3. Enter table number and capacity\n4. Tables show status: Available, Occupied, Reserved, Need Cleaning\n5. Click on a table to view current order or change status",

  "table status":
    "Table statuses:\n- Available: Ready for new customers\n- Occupied: Currently has an active order\n- Reserved: Booked for future\n- Need Cleaning: Requires cleaning before next use\n\nTo change status manually, click on the table and select the new status",

  // Inventory Management
  "add inventory":
    "To add inventory items:\n1. Go to 'Inventory' in the sidebar\n2. Click 'Add Item'\n3. Enter item name, unit (kg, liter, piece, etc.)\n4. Set current stock and reorder level\n5. Click 'Save'\n\nThe system will alert you when stock falls below reorder level",

  "update stock":
    "To update stock levels:\n1. Go to 'Inventory'\n2. Find the item and click 'Update Stock'\n3. Select change type (Add, Remove, Adjust, Wastage, Usage)\n4. Enter quantity and add remarks if needed\n5. Click 'Confirm'\n\nAll stock changes are logged for tracking",

  "purchase order":
    "To create a purchase order:\n1. Go to 'Inventory' > 'Purchase Orders'\n2. Click 'New Purchase Order'\n3. Select supplier\n4. Add items with quantities and prices\n5. Enter invoice number if available\n6. Click 'Save'\n\nStock is automatically updated when purchase order is saved",

  // Employee & Attendance
  "add employee":
    "To add an employee:\n1. Go to 'Employees' in the sidebar\n2. Click 'Add Employee'\n3. Enter name and employee code\n4. Optionally add biometric ID for attendance device\n5. Link to a user account if they need system access\n6. Click 'Save'",

  attendance:
    "Attendance tracking:\n- Employees can punch IN/OUT using:\n  1. POS login screen (if they have a user account)\n  2. Dedicated biometric device (if configured)\n  3. Manual entry by admin in 'Attendance' section\n\nView attendance:\n1. Go to 'Attendance'\n2. Select date range\n3. View punch-in/out times and calculate work hours",

  // User Management
  "add user":
    "To add a system user (waiter, cashier, etc.):\n1. Go to 'Settings' > 'Users'\n2. Click 'Add User'\n3. Enter name, email, phone\n4. Set password\n5. Select role (Admin, Manager, Cashier, Waiter, Kitchen Staff)\n6. Link to employee profile if needed\n7. Click 'Save'\n\nRoles determine what features they can access",

  "user roles":
    "User roles and permissions:\n- ADMIN: Full access to all features\n- MANAGER: Can manage menu, orders, inventory, reports\n- CASHIER: Can create orders, process payments\n- WAITER: Can create orders, view table status\n- KITCHEN_STAFF: Can view and update order item status\n\nTo change a user's role, edit their profile in Settings > Users",

  // Expenses
  "add expense":
    "To record an expense:\n1. Go to 'Expenses' in the sidebar\n2. Click 'Add Expense'\n3. Enter description (e.g., 'Electricity Bill - January')\n4. Enter amount\n5. Select expense date\n6. Choose category (if configured)\n7. Select payment method and add reference number\n8. Optionally upload receipt image\n9. Click 'Save'",

  "expense category":
    "To manage expense categories:\n1. Go to 'Expenses' > 'Categories'\n2. Click 'Add Category'\n3. Enter name (e.g., 'Utilities', 'Rent', 'Salary')\n4. Optionally add description and color\n5. Click 'Save'\n\nCategories help organize and analyze expenses in reports",

  "recurring expense":
    "To set up recurring expenses:\n1. Go to 'Expenses' > 'Recurring'\n2. Click 'Add Recurring Expense'\n3. Enter name (e.g., 'Monthly Rent')\n4. Set amount and interval (Daily, Weekly, Monthly, etc.)\n5. Choose start date\n6. Enable 'Auto Generate' to automatically create expense entries\n7. Click 'Save'\n\nSystem will create expense entries automatically on due dates",

  // Reports & Analytics
  "view reports":
    "To view reports:\n1. Go to 'Reports' in the sidebar\n2. Select report type:\n   - Sales Report: Revenue and order trends\n   - Item Sales: Best-selling items\n   - Payment Analysis: Payment method breakdown\n   - Inventory Report: Stock levels and usage\n   - Expense Report: Expense trends by category\n3. Select date range\n4. Click 'Generate Report'\n5. Export as PDF or Excel if needed",

  // AI Chat Assistant
  "use ai":
    "To use the AI assistant (Rasoi AI):\n1. Click the chat icon in the bottom right\n2. Ask questions in English or Hindi, such as:\n   - 'What was yesterday's revenue?'\n   - 'Show me low stock items'\n   - 'Which items sold the most this week?'\n   - 'Show orders for table 5'\n3. The AI will fetch data and present it clearly\n4. You can ask follow-up questions in the same conversation",

  // Troubleshooting
  "order not appearing":
    "If an order is not appearing:\n1. Check if you're viewing the correct date range\n2. Verify the table/order type filter is not excluding it\n3. Check order status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)\n4. Refresh the page\n5. If problem persists, check with admin or contact support",

  "login issues":
    "If you can't log in:\n1. Verify your email and password are correct\n2. Check if your account is active (contact admin)\n3. Try resetting your password using 'Forgot Password'\n4. Clear browser cache and cookies\n5. Try a different browser\n6. Contact your restaurant admin for account issues",

  "payment not recorded":
    "If a payment is not recorded:\n1. Go to the order details\n2. Check the 'Payments' section\n3. If missing, click 'Add Payment' and record it manually\n4. Verify the payment status shows as PAID or PARTIAL\n5. If issue persists, contact support",
};

/**
 * Knowledge Base Tool for Platform Help
 * Searches the knowledge base for how-to guides and FAQs
 */
export function createKnowledgeBaseTool() {
  return new DynamicStructuredTool({
    name: "search_help_guide",
    description:
      "Search the user manual and help guides for how-to questions about using the platform (e.g., 'how to add menu item', 'how to refund', 'how to manage tables', 'user roles'). Use this for operational questions, NOT for data queries.",
    schema: z.object({
      topic: z
        .string()
        .describe(
          "The specific topic or feature the user needs help with (e.g., 'add menu item', 'refund', 'attendance')"
        ),
    }),
    func: async ({ topic }) => {
      try {
        const lowerTopic = topic.toLowerCase().trim();

        // Try to find an exact or partial match
        const matches: Array<{ key: string; value: string; score: number }> =
          [];

        Object.entries(KNOWLEDGE_BASE).forEach(([key, value]) => {
          const lowerKey = key.toLowerCase();

          // Exact match
          if (lowerKey === lowerTopic) {
            matches.push({ key, value, score: 100 });
          }
          // Topic contains key
          else if (lowerTopic.includes(lowerKey)) {
            matches.push({ key, value, score: 80 });
          }
          // Key contains topic
          else if (lowerKey.includes(lowerTopic)) {
            matches.push({ key, value, score: 60 });
          }
          // Check individual words
          else {
            const topicWords = lowerTopic.split(/\s+/);
            const keyWords = lowerKey.split(/\s+/);
            const matchingWords = topicWords.filter((word) =>
              keyWords.some((kw) => kw.includes(word) || word.includes(kw))
            );
            if (matchingWords.length > 0) {
              matches.push({
                key,
                value,
                score: (matchingWords.length / topicWords.length) * 50,
              });
            }
          }
        });

        // Sort by score and get the best match
        matches.sort((a, b) => b.score - a.score);

        if (matches.length === 0) {
          return `I couldn't find a specific guide for "${topic}". Please check the Help section in the dashboard settings, or ask your question in a different way. You can also contact support for assistance.`;
        }

        const bestMatch = matches[0]!; // Safe because we checked matches.length > 0

        // If we have a good match (score > 50), return it
        if (bestMatch.score > 50) {
          return bestMatch.value;
        }

        // If we have multiple decent matches, suggest them
        if (matches.length > 1 && matches[1]!.score > 40) {
          const suggestions = matches
            .slice(0, 3)
            .map((m) => `- ${m.key}`)
            .join("\n");
          return `I found several related topics:\n${suggestions}\n\nPlease ask about a specific topic from the list above.`;
        }

        // Return the best match we have
        return bestMatch.value;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return `Error searching help guide: ${message}`;
      }
    },
  });
}

/**
 * Utility function to list all available help topics
 */
export function listHelpTopics(): string[] {
  return Object.keys(KNOWLEDGE_BASE).sort();
}
