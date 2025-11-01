import { z } from "zod";

export const handleChat = z.object({
  body: z.object({
    message: z.string().min(1, "Message cannot be empty"),
    // The client can send an existing conversationId to continue a chat
    conversationId: z.string().uuid().optional(),
  }),
});
