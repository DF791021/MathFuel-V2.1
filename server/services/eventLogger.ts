import * as db from "../db";

type PracticeEventType =
  | "SESSION_STARTED"
  | "QUESTION_SERVED"
  | "QUESTION_ANSWERED"
  | "HINT_USED"
  | "LEVEL_ADJUSTED"
  | "STRUGGLE_DETECTED"
  | "SESSION_COMPLETED"
  | "WEEKLY_REPORT_GENERATED";

export async function logEvent(
  eventType: PracticeEventType,
  studentId: number,
  sessionId: number | null,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    await db.logPracticeEvent({
      studentId,
      sessionId: sessionId ?? undefined,
      eventType: eventType as any,
      payload,
    });
  } catch {
    // Event logging is best-effort — never fail the main operation
  }
}
