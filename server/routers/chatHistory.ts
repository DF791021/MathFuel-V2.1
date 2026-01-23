import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  createChatConversation,
  getTeacherConversations,
  getConversation,
  updateConversationTitle,
  deleteConversation,
  addChatMessage,
  getConversationMessages,
  clearConversationMessages,
} from "../db";

export const chatHistoryRouter = router({
  // Create a new conversation
  createConversation: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        mode: z.enum(["general", "ideas", "resources", "trivia", "challenges"]).default("general"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conversationId = await createChatConversation(
        ctx.user.id,
        input.title,
        input.mode
      );
      return { id: conversationId };
    }),

  // Get all conversations for the current teacher
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    return await getTeacherConversations(ctx.user.id);
  }),

  // Get a specific conversation
  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return await getConversation(input.conversationId);
    }),

  // Get messages for a conversation
  getMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ input }) => {
      return await getConversationMessages(input.conversationId);
    }),

  // Add a message to a conversation
  addMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
        mode: z.enum(["general", "ideas", "resources", "trivia", "challenges"]).default("general"),
      })
    )
    .mutation(async ({ input }) => {
      const messageId = await addChatMessage(
        input.conversationId,
        input.role,
        input.content,
        input.mode
      );
      return { id: messageId };
    }),

  // Update conversation title
  updateTitle: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        title: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ input }) => {
      await updateConversationTitle(input.conversationId, input.title);
      return { success: true };
    }),

  // Delete a conversation
  deleteConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      await deleteConversation(input.conversationId);
      return { success: true };
    }),

  // Clear all messages in a conversation
  clearMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      await clearConversationMessages(input.conversationId);
      return { success: true };
    }),
});
