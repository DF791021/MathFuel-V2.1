import { describe, it, expect } from "vitest";
import { invokeLLM } from "./server/_core/llm";

describe("OpenAI Integration", () => {
  it("should successfully call OpenAI API with the provided key", async () => {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant for teachers.",
          },
          {
            role: "user",
            content: "Say 'OpenAI API is working correctly' if you can read this.",
          },
        ],
      });

      expect(response).toBeDefined();
      expect(response.choices).toBeDefined();
      expect(response.choices.length).toBeGreaterThan(0);
      expect(response.choices[0].message).toBeDefined();
      expect(response.choices[0].message.content).toBeDefined();
      expect(typeof response.choices[0].message.content).toBe("string");
    } catch (error) {
      console.error("OpenAI API Error:", error);
      throw new Error(
        `OpenAI API key validation failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  });
});
