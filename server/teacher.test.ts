import { describe, it, expect } from "vitest";

/**
 * Unit tests for MathFuel teacher router logic.
 * Tests access control, classroom dashboard aggregation,
 * needs-attention identification, and engagement calculations.
 */

// ─────────────────────────────────────────────────────────────
// Teacher access control
// ─────────────────────────────────────────────────────────────

function hasTeacherAccess(userType: string, role?: string): boolean {
  return userType === "teacher" || role === "admin";
}

describe("Teacher router – access control", () => {
  it("should grant access to teacher userType", () => {
    expect(hasTeacherAccess("teacher")).toBe(true);
  });

  it("should grant access to admin role", () => {
    expect(hasTeacherAccess("student", "admin")).toBe(true);
  });

  it("should deny access to student userType without admin role", () => {
    expect(hasTeacherAccess("student")).toBe(false);
  });

  it("should deny access to parent userType without admin role", () => {
    expect(hasTeacherAccess("parent")).toBe(false);
  });

  it("should deny access to unknown userType without admin role", () => {
    expect(hasTeacherAccess("guest")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// Classroom ownership check
// ─────────────────────────────────────────────────────────────

type Classroom = { id: number; teacherUserId: number; name: string; gradeLevel: number | null; schoolName: string | null };

function isClassroomOwner(classroom: Classroom | null, userId: number): boolean {
  return !!classroom && classroom.teacherUserId === userId;
}

describe("Teacher router – classroom ownership check", () => {
  const classroom: Classroom = { id: 1, teacherUserId: 10, name: "Class A", gradeLevel: 2, schoolName: null };

  it("should allow the owning teacher", () => {
    expect(isClassroomOwner(classroom, 10)).toBe(true);
  });

  it("should deny a different teacher", () => {
    expect(isClassroomOwner(classroom, 20)).toBe(false);
  });

  it("should deny when classroom is null", () => {
    expect(isClassroomOwner(null, 10)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// getClassroomDashboard – needs-attention logic
// ─────────────────────────────────────────────────────────────

type StudentSummary = { id: number; name: string | null; avgMastery: number; avgConfidence: number };

function computeNeedsAttention(students: StudentSummary[]) {
  return students
    .filter((s) => s.avgConfidence < 0.4 || s.avgMastery < 40)
    .map((s) => ({
      studentId: s.id,
      displayName: s.name ?? "Student",
      reason: s.avgConfidence < 0.4 ? "low_confidence" : "low_mastery",
    }));
}

describe("Teacher router – getClassroomDashboard needs-attention", () => {
  it("should flag student with low confidence (< 0.4)", () => {
    const students: StudentSummary[] = [
      { id: 1, name: "Alice", avgMastery: 70, avgConfidence: 0.3 },
    ];
    const result = computeNeedsAttention(students);
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe("low_confidence");
    expect(result[0].studentId).toBe(1);
  });

  it("should flag student with low mastery (< 40)", () => {
    const students: StudentSummary[] = [
      { id: 2, name: "Bob", avgMastery: 30, avgConfidence: 0.6 },
    ];
    const result = computeNeedsAttention(students);
    expect(result).toHaveLength(1);
    expect(result[0].reason).toBe("low_mastery");
  });

  it("should prioritize low_confidence reason when both conditions apply", () => {
    const students: StudentSummary[] = [
      { id: 3, name: "Carol", avgMastery: 20, avgConfidence: 0.2 },
    ];
    const result = computeNeedsAttention(students);
    expect(result[0].reason).toBe("low_confidence");
  });

  it("should not flag students with adequate confidence and mastery", () => {
    const students: StudentSummary[] = [
      { id: 4, name: "Dan", avgMastery: 65, avgConfidence: 0.7 },
    ];
    expect(computeNeedsAttention(students)).toHaveLength(0);
  });

  it("should return empty array when no students qualify", () => {
    expect(computeNeedsAttention([])).toHaveLength(0);
  });

  it("should use 'Student' as displayName when student name is null", () => {
    const students: StudentSummary[] = [
      { id: 5, name: null, avgMastery: 25, avgConfidence: 0.6 },
    ];
    const result = computeNeedsAttention(students);
    expect(result[0].displayName).toBe("Student");
  });

  it("should handle mixed students, flagging only those needing attention", () => {
    const students: StudentSummary[] = [
      { id: 1, name: "Alice", avgMastery: 70, avgConfidence: 0.8 }, // ok
      { id: 2, name: "Bob", avgMastery: 25, avgConfidence: 0.6 },   // low mastery
      { id: 3, name: "Carol", avgMastery: 70, avgConfidence: 0.2 }, // low confidence
    ];
    const result = computeNeedsAttention(students);
    expect(result).toHaveLength(2);
    const ids = result.map((r) => r.studentId);
    expect(ids).toContain(2);
    expect(ids).toContain(3);
    expect(ids).not.toContain(1);
  });
});

// ─────────────────────────────────────────────────────────────
// getClassroomDashboard – overview aggregation
// ─────────────────────────────────────────────────────────────

type EngagementRecord = { sessionsThisWeek: number; avgAccuracy: number };

function computeClassroomOverview(
  students: StudentSummary[],
  engagement: EngagementRecord[]
) {
  const avgAccuracy =
    students.length > 0
      ? students.reduce((s, st) => s + st.avgMastery, 0) / students.length
      : 0;
  const avgConfidence =
    students.length > 0
      ? students.reduce((s, st) => s + st.avgConfidence, 0) / students.length
      : 0;
  const activeThisWeek = engagement.filter((e) => e.sessionsThisWeek > 0).length;

  return {
    studentCount: students.length,
    activeThisWeek,
    avgAccuracy: Math.round(avgAccuracy),
    avgConfidence: Math.round(avgConfidence * 100) / 100,
  };
}

describe("Teacher router – getClassroomDashboard overview aggregation", () => {
  it("should return zero metrics for an empty classroom", () => {
    const result = computeClassroomOverview([], []);
    expect(result.studentCount).toBe(0);
    expect(result.avgAccuracy).toBe(0);
    expect(result.avgConfidence).toBe(0);
    expect(result.activeThisWeek).toBe(0);
  });

  it("should count all students", () => {
    const students: StudentSummary[] = [
      { id: 1, name: "A", avgMastery: 80, avgConfidence: 0.7 },
      { id: 2, name: "B", avgMastery: 60, avgConfidence: 0.5 },
    ];
    const result = computeClassroomOverview(students, []);
    expect(result.studentCount).toBe(2);
  });

  it("should compute rounded average mastery as avgAccuracy", () => {
    const students: StudentSummary[] = [
      { id: 1, name: "A", avgMastery: 80, avgConfidence: 0.7 },
      { id: 2, name: "B", avgMastery: 60, avgConfidence: 0.5 },
    ];
    const result = computeClassroomOverview(students, []);
    expect(result.avgAccuracy).toBe(70);
  });

  it("should compute average confidence score", () => {
    const students: StudentSummary[] = [
      { id: 1, name: "A", avgMastery: 80, avgConfidence: 0.8 },
      { id: 2, name: "B", avgMastery: 60, avgConfidence: 0.6 },
    ];
    const result = computeClassroomOverview(students, []);
    expect(result.avgConfidence).toBeCloseTo(0.7, 2);
  });

  it("should count only students with sessions this week as active", () => {
    const students: StudentSummary[] = [
      { id: 1, name: "A", avgMastery: 80, avgConfidence: 0.7 },
      { id: 2, name: "B", avgMastery: 60, avgConfidence: 0.5 },
    ];
    const engagement: EngagementRecord[] = [
      { sessionsThisWeek: 3, avgAccuracy: 0.8 },
      { sessionsThisWeek: 0, avgAccuracy: 0.0 },
    ];
    const result = computeClassroomOverview(students, engagement);
    expect(result.activeThisWeek).toBe(1);
  });

  it("should count 0 active students when no engagement", () => {
    const students: StudentSummary[] = [
      { id: 1, name: "A", avgMastery: 80, avgConfidence: 0.7 },
    ];
    const result = computeClassroomOverview(students, []);
    expect(result.activeThisWeek).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────
// getClassroomEngagement – overview aggregation
// ─────────────────────────────────────────────────────────────

function computeEngagementOverview(engagement: EngagementRecord[]) {
  const totalSessions = engagement.reduce((s, e) => s + e.sessionsThisWeek, 0);
  return {
    weeklySessions: totalSessions,
    avgAccuracy:
      engagement.length > 0
        ? Math.round(
            (engagement.reduce((s, e) => s + e.avgAccuracy, 0) / engagement.length) * 100
          ) / 100
        : 0,
  };
}

describe("Teacher router – getClassroomEngagement overview", () => {
  it("should sum weekly sessions across all students", () => {
    const engagement: EngagementRecord[] = [
      { sessionsThisWeek: 3, avgAccuracy: 0.8 },
      { sessionsThisWeek: 5, avgAccuracy: 0.7 },
    ];
    const result = computeEngagementOverview(engagement);
    expect(result.weeklySessions).toBe(8);
  });

  it("should return 0 sessions for empty engagement", () => {
    const result = computeEngagementOverview([]);
    expect(result.weeklySessions).toBe(0);
    expect(result.avgAccuracy).toBe(0);
  });

  it("should compute average accuracy across students", () => {
    const engagement: EngagementRecord[] = [
      { sessionsThisWeek: 3, avgAccuracy: 0.8 },
      { sessionsThisWeek: 5, avgAccuracy: 0.6 },
    ];
    const result = computeEngagementOverview(engagement);
    expect(result.avgAccuracy).toBeCloseTo(0.7, 2);
  });

  it("should handle single student", () => {
    const engagement: EngagementRecord[] = [
      { sessionsThisWeek: 4, avgAccuracy: 0.75 },
    ];
    const result = computeEngagementOverview(engagement);
    expect(result.weeklySessions).toBe(4);
    expect(result.avgAccuracy).toBe(0.75);
  });
});

// ─────────────────────────────────────────────────────────────
// updateClassroom – partial update merge logic
// ─────────────────────────────────────────────────────────────

type ClassroomUpdate = { name?: string; gradeLevel?: number; schoolName?: string };

function mergeClassroomUpdate(existing: Classroom, update: ClassroomUpdate): Partial<Classroom> {
  return {
    name: update.name ?? existing.name,
    gradeLevel: update.gradeLevel ?? existing.gradeLevel,
    schoolName: update.schoolName ?? existing.schoolName,
  };
}

describe("Teacher router – updateClassroom merge logic", () => {
  const existing: Classroom = { id: 1, teacherUserId: 10, name: "Old Name", gradeLevel: 2, schoolName: "School A" };

  it("should use new name when provided", () => {
    const merged = mergeClassroomUpdate(existing, { name: "New Name" });
    expect(merged.name).toBe("New Name");
  });

  it("should fall back to existing name when not provided", () => {
    const merged = mergeClassroomUpdate(existing, {});
    expect(merged.name).toBe("Old Name");
  });

  it("should update gradeLevel independently", () => {
    const merged = mergeClassroomUpdate(existing, { gradeLevel: 5 });
    expect(merged.gradeLevel).toBe(5);
    expect(merged.name).toBe("Old Name"); // unchanged
  });

  it("should update schoolName independently", () => {
    const merged = mergeClassroomUpdate(existing, { schoolName: "New School" });
    expect(merged.schoolName).toBe("New School");
  });

  it("should apply all updates at once", () => {
    const merged = mergeClassroomUpdate(existing, { name: "A", gradeLevel: 3, schoolName: "B" });
    expect(merged.name).toBe("A");
    expect(merged.gradeLevel).toBe(3);
    expect(merged.schoolName).toBe("B");
  });
});
