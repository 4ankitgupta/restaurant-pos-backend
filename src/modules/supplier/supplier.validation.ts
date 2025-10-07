import { z } from "zod";

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    address: z.string().optional(),
  }),
});

export const updateSupplierSchema = z.object({
  body: createSupplierSchema.shape.body.partial(), // All fields are optional
});
