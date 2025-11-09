import { z } from "zod";

export const handleChat = z.object({
  body: z.object({
    message: z.string().min(1, "Message cannot be empty"),
    // The client can send an existing conversationId to continue a chat
    conversationId: z.string().uuid().optional(),
  }),
});

// --- ADD THIS VALIDATION ---
export const getConversationMessages = z.object({
  params: z.object({
    conversationId: z.string().uuid("Invalid conversationId"),
  }),
});

export const deleteConversation = z.object({
  params: z.object({
    conversationId: z.string().uuid("Invalid conversationId"),
  }),
});
