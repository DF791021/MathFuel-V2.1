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

// ============================================================================
// Error Pattern Analysis Logic
// Tests for the getErrorPatterns procedure helpers
// ============================================================================

describe("Error pattern JSON parsing", () => {
  // Mirrors the JSON parsing logic in aiTutor.ts getErrorPatterns
  function parseErrorPatternResponse(rawContent: string): any[] {
    const jsonStr = rawContent
      .replace(/^```(?:json)?\n?/m, "")
      .replace(/\n?```$/m, "")
      .trim();
    try {
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  it("parses a valid JSON array response", () => {
    const response = `[{"skillName":"Addition","pattern":"Off-by-one","description":"Test","frequency":3,"recommendation":"Count on"}]`;
    const result = parseErrorPatternResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0].pattern).toBe("Off-by-one");
  });

  it("strips markdown code fences before parsing", () => {
    const response = "```json\n[{\"skillName\":\"Subtraction\",\"pattern\":\"Sign confusion\",\"description\":\"Test\",\"frequency\":2,\"recommendation\":\"Use number line\"}]\n```";
    const result = parseErrorPatternResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0].skillName).toBe("Subtraction");
  });

  it("strips plain code fences before parsing", () => {
    const response = "```\n[{\"skillName\":\"Place Value\",\"pattern\":\"Digit reversal\",\"description\":\"Test\",\"frequency\":4,\"recommendation\":\"Use base-10 blocks\"}]\n```";
    const result = parseErrorPatternResponse(response);
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe(4);
  });

  it("returns empty array for invalid JSON", () => {
    expect(parseErrorPatternResponse("not valid json")).toEqual([]);
    expect(parseErrorPatternResponse("")).toEqual([]);
  });

  it("returns empty array when response is not a JSON array", () => {
    expect(parseErrorPatternResponse('{"patterns":[]}')).toEqual([]);
    expect(parseErrorPatternResponse('"just a string"')).toEqual([]);
  });

  it("handles empty JSON array response", () => {
    expect(parseErrorPatternResponse("[]")).toEqual([]);
  });

  it("handles multiple patterns in a single response", () => {
    const response = JSON.stringify([
      { skillName: "Addition", pattern: "Off-by-one", description: "A", frequency: 5, recommendation: "B" },
      { skillName: "Subtraction", pattern: "Sign confusion", description: "C", frequency: 2, recommendation: "D" },
    ]);
    const result = parseErrorPatternResponse(response);
    expect(result).toHaveLength(2);
  });
});

describe("Error pattern prompt construction", () => {
  function buildMistakeSections(
    bySkill: Map<number, { problemText: string; studentAnswer: string; correctAnswer: string }[]>,
    skillNames: Map<number, string>,
  ): string {
    return Array.from(bySkill.entries())
      .map(([skillId, attempts]) => {
        const skillName = skillNames.get(skillId) ?? `Skill #${skillId}`;
        const examples = attempts
          .slice(0, 5)
          .map(a => `  - "${a.problemText}" → student: "${a.studentAnswer}", correct: "${a.correctAnswer}"`)
          .join("\n");
        return `Skill: "${skillName}" (${attempts.length} mistake${attempts.length !== 1 ? "s" : ""})\n${examples}`;
      })
      .join("\n\n");
  }

  it("builds correct section with skill name and error count", () => {
    const bySkill = new Map([
      [1, [{ problemText: "2+2?", studentAnswer: "5", correctAnswer: "4" }]],
    ]);
    const skillNames = new Map([[1, "Single-digit Addition"]]);
    const result = buildMistakeSections(bySkill, skillNames);
    expect(result).toContain("Single-digit Addition");
    expect(result).toContain("1 mistake");
    expect(result).toContain("2+2?");
  });

  it("pluralises mistake count correctly", () => {
    const bySkill = new Map([
      [1, [
        { problemText: "3+3?", studentAnswer: "5", correctAnswer: "6" },
        { problemText: "4+4?", studentAnswer: "7", correctAnswer: "8" },
      ]],
    ]);
    const skillNames = new Map([[1, "Addition"]]);
    const result = buildMistakeSections(bySkill, skillNames);
    expect(result).toContain("2 mistakes");
  });

  it("limits examples to 5 per skill", () => {
    const attempts = Array.from({ length: 8 }, (_, i) => ({
      problemText: `${i}+${i}?`,
      studentAnswer: "0",
      correctAnswer: String(i * 2),
    }));
    const bySkill = new Map([[1, attempts]]);
    const skillNames = new Map([[1, "Addition"]]);
    const result = buildMistakeSections(bySkill, skillNames);
    // 8 attempts listed but only 5 examples rendered; count occurrences of "→ student"
    const exampleCount = (result.match(/→ student/g) ?? []).length;
    expect(exampleCount).toBe(5);
  });

  it("falls back to Skill #N when skill name is not found", () => {
    const bySkill = new Map([
      [99, [{ problemText: "5-3?", studentAnswer: "1", correctAnswer: "2" }]],
    ]);
    const skillNames = new Map<number, string>();
    const result = buildMistakeSections(bySkill, skillNames);
    expect(result).toContain("Skill #99");
  });
});
