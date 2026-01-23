import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getChatbotResponse, ChatMode } from "../_core/teacherChatbot";

export const teacherChatbotRouter = router({
  sendMessage: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        mode: z.enum(["general", "ideas", "resources", "trivia", "challenges"]).default("general"),
        conversationHistory: z.array(
          z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
          })
        ).optional().default([]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await getChatbotResponse(
          input.message,
          input.mode as ChatMode,
          input.conversationHistory
        );

        return {
          success: true,
          message: response,
          mode: input.mode,
        };
      } catch (error) {
        console.error("Chatbot error:", error);
        throw new Error(
          `Failed to get chatbot response: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),

  getModes: protectedProcedure.query(() => {
    return [
      {
        id: "general",
        name: "General Support",
        description: "Get advice and support for teaching challenges",
        icon: "💬",
      },
      {
        id: "ideas",
        name: "Lesson Ideas",
        description: "Get creative lesson ideas and classroom strategies",
        icon: "💡",
      },
      {
        id: "resources",
        name: "Resources",
        description: "Find educational resources and support services",
        icon: "📚",
      },
      {
        id: "trivia",
        name: "Fun Trivia",
        description: "Learn about teachers and education worldwide",
        icon: "🌍",
      },
      {
        id: "challenges",
        name: "Challenges",
        description: "Get fun educational challenges for your classroom",
        icon: "🎯",
      },
    ];
  }),
});
