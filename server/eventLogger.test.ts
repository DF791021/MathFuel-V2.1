import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Unit tests for MathFuel eventLogger service.
 * Tests event dispatch to the database and silent failure on error.
 */

// ── Mock db module (factory must not reference outer variables – hoisting) ──
vi.mock("./db", () => ({
  logPracticeEvent: vi.fn(),
}));

import { logEvent } from "./services/eventLogger";
import * as db from "./db";

describe("eventLogger – logEvent", () => {
  const mockLogPracticeEvent = vi.mocked(db.logPracticeEvent);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call db.logPracticeEvent with correct arguments", async () => {
    mockLogPracticeEvent.mockResolvedValue(undefined);

    await logEvent("SESSION_STARTED", 42, 7, { foo: "bar" });

    expect(mockLogPracticeEvent).toHaveBeenCalledTimes(1);
    expect(mockLogPracticeEvent).toHaveBeenCalledWith({
      studentId: 42,
      sessionId: 7,
      eventType: "SESSION_STARTED",
      payload: { foo: "bar" },
    });
  });

  it("should default to empty payload when none is provided", async () => {
    mockLogPracticeEvent.mockResolvedValue(undefined);

    await logEvent("HINT_USED", 10, 3);

    expect(mockLogPracticeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ payload: {} })
    );
  });

  it("should pass sessionId as undefined when null is provided", async () => {
    mockLogPracticeEvent.mockResolvedValue(undefined);

    await logEvent("WEEKLY_REPORT_GENERATED", 5, null, { weekStart: "2024-01-01" });

    expect(mockLogPracticeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: undefined })
    );
  });

  it("should not throw when db.logPracticeEvent rejects (best-effort logging)", async () => {
    mockLogPracticeEvent.mockRejectedValue(new Error("DB connection failed"));

    await expect(logEvent("SESSION_COMPLETED", 1, 1)).resolves.toBeUndefined();
  });

  it("should not throw when db.logPracticeEvent throws synchronously", async () => {
    mockLogPracticeEvent.mockImplementation(() => {
      throw new Error("Unexpected sync error");
    });

    await expect(logEvent("QUESTION_ANSWERED", 2, 5)).resolves.toBeUndefined();
  });

  it("should accept all valid event types", async () => {
    mockLogPracticeEvent.mockResolvedValue(undefined);

    const eventTypes = [
      "SESSION_STARTED",
      "QUESTION_SERVED",
      "QUESTION_ANSWERED",
      "HINT_USED",
      "LEVEL_ADJUSTED",
      "STRUGGLE_DETECTED",
      "SESSION_COMPLETED",
      "WEEKLY_REPORT_GENERATED",
    ] as const;

    for (const eventType of eventTypes) {
      await logEvent(eventType, 1, null);
    }

    expect(mockLogPracticeEvent).toHaveBeenCalledTimes(eventTypes.length);
  });

  it("should forward complex payload objects to the database", async () => {
    mockLogPracticeEvent.mockResolvedValue(undefined);

    const payload = {
      difficulty: 3,
      isCorrect: true,
      responseTimeMs: 4500,
      hintsUsed: 1,
      nested: { key: "value" },
    };

    await logEvent("QUESTION_ANSWERED", 99, 12, payload);

    expect(mockLogPracticeEvent).toHaveBeenCalledWith(
      expect.objectContaining({ payload })
    );
  });
});
