import { z } from "zod";

export const createPunchSchema = z.object({
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
});

export const getReportSchema = z.object({
  query: z
    .object({
      date: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })
    .refine(
      (data) => !data.date || (!data.startDate && !data.endDate),
      "Cannot use date with startDate/endDate"
    ),
});
