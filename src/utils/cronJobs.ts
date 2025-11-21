import cron from "node-cron";
import {
  processRecurringExpenses,
  markOverdueExpenses,
} from "../modules/expense/expense.service.js";

/**
 * Initialize cron jobs for expense automation
 */
export const initializeExpenseCronJobs = () => {
  // Run every day at midnight (00:00) to process recurring expenses
  cron.schedule("0 0 * * *", async () => {
    console.log(
      `[Cron] Running recurring expenses job at ${new Date().toISOString()}`
    );
    try {
      const results = await processRecurringExpenses();
      console.log(
        `[Cron] Recurring expenses job completed. Processed ${results.length} items.`
      );
    } catch (error) {
      console.error("[Cron] Error in recurring expenses job:", error);
    }
  });

  // Run every day at 1:00 AM to mark overdue expenses
  cron.schedule("0 1 * * *", async () => {
    console.log(
      `[Cron] Running overdue expenses job at ${new Date().toISOString()}`
    );
    try {
      const result = await markOverdueExpenses();
      console.log(`[Cron] Overdue expenses job completed.`, result);
    } catch (error) {
      console.error("[Cron] Error in overdue expenses job:", error);
    }
  });

  console.log("✅ Expense automation cron jobs initialized");
};
