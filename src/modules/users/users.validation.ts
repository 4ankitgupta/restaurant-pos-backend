import { z } from "zod";

export const changePasswordSchema = z.object({
  body: z
    .object({
      adminPassword: z
        .string()
        .min(1, "Admin password is required for verification"),
      newPassword: z
        .string()
        .min(6, "New password must be at least 6 characters long"),
      confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }),
  params: z.object({
    id: z.string().uuid("Invalid user ID format"),
  }),
});
