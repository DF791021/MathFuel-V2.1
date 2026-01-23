import { invokeLLM } from "./llm";

export type ChatMode = "general" | "ideas" | "resources" | "trivia" | "challenges";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

const systemPrompts: Record<ChatMode, string> = {
  general: `You are a supportive and knowledgeable AI assistant for teachers. You provide helpful advice, ideas, resources, and encouragement to support educators in their work. Be warm, professional, and practical in your responses. Focus on actionable suggestions and real-world classroom applications.`,

  ideas: `You are a creative teaching assistant specializing in generating innovative lesson ideas, activities, and classroom strategies. Provide engaging, age-appropriate ideas that are practical to implement. Include variations for different learning styles and classroom sizes. Be enthusiastic and encouraging.`,

  resources: `You are an expert resource guide for teachers. Provide recommendations for educational websites, books, apps, professional development opportunities, mental health support, and other resources that can help teachers in their professional and personal lives. Include links when possible and explain why each resource is valuable.`,

  trivia: `You are a fascinating educator sharing interesting historical facts and trivia about teachers and education around the world. Share engaging stories about famous educators, educational innovations, cultural differences in teaching practices, and the evolution of education. Make it entertaining and thought-provoking.`,

  challenges: `You are a creative activity designer specializing in fun educational challenges and games. Create engaging challenges that students can complete, brain teasers, classroom competitions, and interactive activities. Provide clear instructions and explain educational benefits. Make them exciting and motivating.`,
};

export async function getChatbotResponse(
  userMessage: string,
  mode: ChatMode = "general",
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompts[mode],
      },
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    const response = await invokeLLM({
      messages: messages.map((msg) => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content,
      })),
    });

    if (
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message
    ) {
      const content = response.choices[0].message.content;
      if (typeof content === "string") {
        return content;
      }
      return "";
    }

    throw new Error("No response from OpenAI");
  } catch (error) {
    console.error("Chatbot error:", error);
    throw error;
  }
}

export function formatChatResponse(content: string): string {
  // Add markdown formatting for better readability
  return content
    .replace(/\*\*/g, "**") // Preserve bold
    .replace(/\n\n/g, "\n\n") // Preserve paragraphs
    .trim();
}

export function getModeSuggestion(mode: ChatMode): string {
  const suggestions: Record<ChatMode, string> = {
    general:
      "Get general advice and support for teaching challenges and questions",
    ideas: "Get creative lesson ideas, activities, and classroom strategies",
    resources:
      "Find educational resources, professional development, and support services",
    trivia: "Learn interesting facts about teachers and education worldwide",
    challenges:
      "Get fun educational challenges and activities for your classroom",
  };
  return suggestions[mode];
}
