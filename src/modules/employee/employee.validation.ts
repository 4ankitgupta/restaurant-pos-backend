import { z } from "zod";

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    employeeCode: z.string().min(1, "Employee code is required"),
    biometricId: z.string().optional().nullable(),
    userId: z.string().uuid().optional(),
  }),
});

export const updateEmployeeSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").optional(),
    employeeCode: z.string().min(1, "Employee code is required").optional(),
    biometricId: z.string().optional().nullable(),
    userId: z.string().uuid().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});
