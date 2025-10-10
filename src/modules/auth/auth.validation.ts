import { z } from "zod";
import { UserRole } from "@prisma/client";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().optional(),
    role: z.nativeEnum(UserRole),
    restaurantId: z.string().uuid().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
  }),
});
