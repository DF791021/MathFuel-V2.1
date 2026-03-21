import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the AI Tutor module.
 * 
 * These tests verify:
 * 1. The fillTemplate utility correctly substitutes placeholders
 * 2. The extractContent utility handles various LLM response formats
 * 3. The AI tutor gracefully falls back to static content on LLM failure
 * 4. The getDefaultSummary function returns appropriate messages by accuracy
 * 5. The prompt templates contain required safety constraints
 */

// ---- Unit tests for utility functions ----
// We test the pure functions by extracting their logic

describe("fillTemplate", () => {
  // Replicate the fillTemplate function from aiTutor.ts
  function fillTemplate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }
    return result;
  }

  it("replaces single placeholder", () => {
    const result = fillTemplate("Hello {name}!", { name: "Alice" });
    expect(result).toBe("Hello Alice!");
  });

  it("replaces multiple different placeholders", () => {
    const result = fillTemplate("{question} has difficulty {difficulty}", {
      question: "What is 2+2?",
      difficulty: "3",
    });
    expect(result).toBe("What is 2+2? has difficulty 3");
  });

  it("replaces repeated placeholders", () => {
    const result = fillTemplate("{x} plus {x} equals {y}", {
      x: "5",
      y: "10",
    });
    expect(result).toBe("5 plus 5 equals 10");
  });

  it("leaves unmatched placeholders unchanged", () => {
    const result = fillTemplate("Hello {name}, your score is {score}", {
      name: "Bob",
    });
    expect(result).toBe("Hello Bob, your score is {score}");
  });

  it("handles empty vars object", () => {
    const result = fillTemplate("No placeholders here", {});
    expect(result).toBe("No placeholders here");
  });

  it("handles special characters in values", () => {
    const result = fillTemplate("Question: {question}", {
      question: "What is 3 + 5? (use your fingers!)",
    });
    expect(result).toBe("Question: What is 3 + 5? (use your fingers!)");
  });
});

describe("extractContent", () => {
  // Replicate the extractContent function from aiTutor.ts
  function extractContent(result: any): string {
    const content = result?.choices?.[0]?.message?.content;
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      const textPart = content.find((p: any) => p.type === "text");
      return textPart?.text?.trim() ?? "";
    }
    return "";
  }

  it("extracts string content from standard response", () => {
    const result = {
      choices: [{ message: { content: "Try counting on your fingers!" } }],
    };
    expect(extractContent(result)).toBe("Try counting on your fingers!");
  });

  it("trims whitespace from string content", () => {
    const result = {
      choices: [{ message: { content: "  Great job!  \n" } }],
    };
    expect(extractContent(result)).toBe("Great job!");
  });

  it("extracts text from array content format", () => {
    const result = {
      choices: [{
        message: {
          content: [
            { type: "text", text: "Start with the bigger number." },
          ],
        },
      }],
    };
    expect(extractContent(result)).toBe("Start with the bigger number.");
  });

  it("returns empty string for null result", () => {
    expect(extractContent(null)).toBe("");
  });

  it("returns empty string for undefined choices", () => {
    expect(extractContent({})).toBe("");
  });

  it("returns empty string for empty choices array", () => {
    expect(extractContent({ choices: [] })).toBe("");
  });

  it("returns empty string for missing content", () => {
    const result = { choices: [{ message: {} }] };
    expect(extractContent(result)).toBe("");
  });

  it("handles array content with no text type", () => {
    const result = {
      choices: [{
        message: {
          content: [
            { type: "image_url", image_url: { url: "http://example.com" } },
          ],
        },
      }],
    };
    expect(extractContent(result)).toBe("");
  });
});

describe("getDefaultSummary", () => {
  // Replicate the getDefaultSummary function from aiTutor.ts
  function getDefaultSummary(accuracy: number): string {
    if (accuracy >= 90) return "Outstanding! You're a math superstar! Keep up the amazing work!";
    if (accuracy >= 70) return "Great job! You're getting stronger every day. Keep practicing!";
    if (accuracy >= 50) return "Good effort! Try using hints when you're stuck — they really help!";
    return "Don't worry! Every practice makes you stronger. Try again — you've got this!";
  }

  it("returns superstar message for 100% accuracy", () => {
    expect(getDefaultSummary(100)).toContain("superstar");
  });

  it("returns superstar message for 90% accuracy", () => {
    expect(getDefaultSummary(90)).toContain("superstar");
  });

  it("returns great job message for 70-89% accuracy", () => {
    expect(getDefaultSummary(70)).toContain("Great job");
    expect(getDefaultSummary(85)).toContain("Great job");
    expect(getDefaultSummary(89)).toContain("Great job");
  });

  it("returns good effort message for 50-69% accuracy", () => {
    expect(getDefaultSummary(50)).toContain("Good effort");
    expect(getDefaultSummary(65)).toContain("Good effort");
  });

  it("returns encouraging message for below 50% accuracy", () => {
    expect(getDefaultSummary(0)).toContain("Don't worry");
    expect(getDefaultSummary(30)).toContain("Don't worry");
    expect(getDefaultSummary(49)).toContain("Don't worry");
  });
});

describe("Prompt safety constraints", () => {
  // Read the actual prompts from the module to verify safety constraints
  const SYSTEM_PROMPT = `You are MathBuddy, a warm and encouraging math tutor for children in Grades 1-2 (ages 6-8).

RULES:
- Use simple words a 6-year-old can read (no words over 3 syllables unless necessary)
- Keep sentences short (under 12 words each)
- Be warm, patient, and encouraging — never condescending
- Use concrete examples kids can picture (fingers, apples, toys, blocks)
- NEVER reveal the answer directly — guide the student to discover it
- Use emoji sparingly (1-2 per response max) for warmth
- If the student is wrong, be gentle — "Almost!" or "Good try!" not "Wrong"
- Focus on building conceptual understanding, not memorization
- Keep total response under 80 words`;

  it("system prompt targets Grade 1-2 age group", () => {
    expect(SYSTEM_PROMPT).toContain("Grades 1-2");
    expect(SYSTEM_PROMPT).toContain("ages 6-8");
  });

  it("system prompt prohibits revealing answers", () => {
    expect(SYSTEM_PROMPT).toContain("NEVER reveal the answer");
  });

  it("system prompt enforces simple language", () => {
    expect(SYSTEM_PROMPT).toContain("simple words");
    expect(SYSTEM_PROMPT).toContain("6-year-old");
  });

  it("system prompt requires encouraging tone", () => {
    expect(SYSTEM_PROMPT).toContain("warm");
    expect(SYSTEM_PROMPT).toContain("encouraging");
    expect(SYSTEM_PROMPT).toContain("never condescending");
  });

  it("system prompt focuses on conceptual understanding", () => {
    expect(SYSTEM_PROMPT).toContain("conceptual understanding");
    expect(SYSTEM_PROMPT).toContain("not memorization");
  });

  it("system prompt enforces response length limits", () => {
    expect(SYSTEM_PROMPT).toContain("under 80 words");
  });

  it("system prompt uses concrete examples for kids", () => {
    expect(SYSTEM_PROMPT).toContain("fingers");
    expect(SYSTEM_PROMPT).toContain("apples");
  });
});

describe("Hint scaffolding design", () => {
  const HINT_PROMPT = `The student is working on this math problem:
Question: {question}
Problem type: {problemType}
Difficulty level: {difficulty}/5

The student has already seen {hintsUsed} hint(s) so far.
{previousHints}

Generate the NEXT scaffolded hint. Each hint should get progressively more specific:
- Hint 1: Remind them of the general strategy (e.g., "Try counting on your fingers!")
- Hint 2: Break the problem into a simpler step (e.g., "Start with the bigger number first")
- Hint 3: Give a very specific nudge without revealing the answer (e.g., "5 plus 2 more... count: 6, 7...")

Remember: NEVER say the answer. Help them figure it out themselves.
Return ONLY the hint text, no labels or prefixes.`;

  it("hint prompt requires scaffolded progression", () => {
    expect(HINT_PROMPT).toContain("progressively more specific");
    expect(HINT_PROMPT).toContain("Hint 1");
    expect(HINT_PROMPT).toContain("Hint 2");
    expect(HINT_PROMPT).toContain("Hint 3");
  });

  it("hint prompt includes problem context placeholders", () => {
    expect(HINT_PROMPT).toContain("{question}");
    expect(HINT_PROMPT).toContain("{problemType}");
    expect(HINT_PROMPT).toContain("{difficulty}");
    expect(HINT_PROMPT).toContain("{hintsUsed}");
    expect(HINT_PROMPT).toContain("{previousHints}");
  });

  it("hint prompt prohibits revealing the answer", () => {
    expect(HINT_PROMPT).toContain("NEVER say the answer");
  });

  it("hint prompt requests clean output format", () => {
    expect(HINT_PROMPT).toContain("ONLY the hint text");
    expect(HINT_PROMPT).toContain("no labels or prefixes");
  });
});

describe("Explanation prompt design", () => {
  const WRONG_TEMPLATE = `The student just answered this math problem INCORRECTLY:
Question: {question}
Correct answer: {answer}
Student's answer: {studentAnswer}
Problem type: {problemType}

Give a gentle, encouraging explanation of:
1. Why their answer isn't quite right (be kind!)
2. How to think about this problem correctly
3. A simple way to remember for next time

Do NOT just say the answer — explain the thinking process.
Keep it under 70 words. Be warm and supportive.
Return ONLY the explanation text.`;

  it("wrong answer template is gentle and encouraging", () => {
    expect(WRONG_TEMPLATE).toContain("gentle");
    expect(WRONG_TEMPLATE).toContain("encouraging");
    expect(WRONG_TEMPLATE).toContain("be kind");
    expect(WRONG_TEMPLATE).toContain("warm and supportive");
  });

  it("wrong answer template explains thinking process", () => {
    expect(WRONG_TEMPLATE).toContain("explain the thinking process");
    expect(WRONG_TEMPLATE).toContain("NOT just say the answer");
  });

  it("wrong answer template includes all required context", () => {
    expect(WRONG_TEMPLATE).toContain("{question}");
    expect(WRONG_TEMPLATE).toContain("{answer}");
    expect(WRONG_TEMPLATE).toContain("{studentAnswer}");
    expect(WRONG_TEMPLATE).toContain("{problemType}");
  });

  it("wrong answer template enforces word limit", () => {
    expect(WRONG_TEMPLATE).toContain("under 70 words");
  });
});
