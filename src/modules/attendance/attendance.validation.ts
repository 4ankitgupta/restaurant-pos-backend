import { z } from "zod";

export const createPunchSchema = z
  .object({
    body: z
      .object({
        employeeCode: z.string().optional(),
        biometricId: z.string().optional(),
        source: z.string().optional(),
      })
      .refine(
        (data) => !!data.employeeCode || !!data.biometricId,
        "Either employeeCode or biometricId is required"
      ),
  })
  .strict();

export const getReportSchema = z.object({
  query: z
    .object({
      date: z.string().datetime("Invalid date format. Use ISO 8601").optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
    .refine(
      (data) => !data.date || (!data.startDate && !data.endDate),
      "Cannot use date with startDate/endDate"
    ),
});
