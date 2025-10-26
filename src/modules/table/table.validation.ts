import { z } from "zod";
import { TableStatus } from "@prisma/client";

const tableStatusEnum = z.nativeEnum(TableStatus);

export const createTableSchema = z.object({
  body: z.object({
    tableNumber: z.string().min(1, "Table number is required"),
    capacity: z.coerce
      .number()
      .int("Capacity must be a whole number")
      .positive("Capacity must be greater than zero"),
    status: tableStatusEnum.optional(),
  }),
});

export const updateTableSchema = z.object({
  params: z.object({
    tableId: z.string().uuid("A valid table ID is required"),
  }),
  body: z
    .object({
      tableNumber: z.string().min(1, "Table number is required").optional(),
      capacity: z.coerce
        .number()
        .int("Capacity must be a whole number")
        .positive("Capacity must be greater than zero")
        .optional(),
      status: tableStatusEnum.optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.tableNumber === undefined &&
        data.capacity === undefined &&
        data.status === undefined
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one field must be provided",
        });
      }
    }),
});

export const deleteTableSchema = z.object({
  params: z.object({
    tableId: z.string().uuid("A valid table ID is required"),
  }),
});
