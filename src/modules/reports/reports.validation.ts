import { z } from "zod";

export const dateRangeSchema = z.object({
  query: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .refine((data) => !data.startDate || !isNaN(Date.parse(data.startDate)), {
      message: "Invalid start date format",
      path: ["startDate"],
    })
    .refine((data) => !data.endDate || !isNaN(Date.parse(data.endDate)), {
      message: "Invalid end date format",
      path: ["endDate"],
    }),
});

export const singleDateSchema = z.object({
  query: z
    .object({
      date: z.string().optional(),
    })
    .refine((data) => !data.date || !isNaN(Date.parse(data.date)), {
      message: "Invalid date format",
      path: ["date"],
    }),
});

export const salesReportSchema = z.object({
  query: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      userId: z.string().optional(),
      // 👇 FIX: Replaced nativeEnum(OrderType) with a simple string enum
      orderType: z.enum(["DINE_IN", "TAKEAWAY"]).optional(),
      categoryId: z.string().optional(),
    })
    .refine((data) => !data.startDate || !isNaN(Date.parse(data.startDate)), {
      message: "Invalid start date format",
      path: ["startDate"],
    })
    .refine((data) => !data.endDate || !isNaN(Date.parse(data.endDate)), {
      message: "Invalid end date format",
      path: ["endDate"],
    }),
});
