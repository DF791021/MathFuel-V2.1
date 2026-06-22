/*
  # Add Missing Composite and Covering Indexes

  ## Purpose
  The adaptive engine, mastery calculations, and dashboards all run queries
  that cross-filter on multiple columns. Without composite indexes these
  queries fall back to full sequential scans, which become expensive at scale.

  ## New Indexes

  ### problemAttempts
  - (studentId, createdAt DESC)
    Most common query: "get recent attempts for student X" — used in
    progress dashboards and session history views.
  - (skillId, isCorrect)
    Used by mastery recalculation: "how many correct attempts for skill X?"
  - (sessionId, createdAt)
    Used when pulling all attempts for a specific session.

  ### mathProblems
  - (skillId, isActive)
    Core adaptive engine query: "get active problems for skill X at difficulty Y"
    without scanning inactive problems.

  ### mathSkills
  - (domainId, isActive)
    Skill tree rendering: "get active skills in domain X ordered by displayOrder"
  - (prerequisiteSkillId) — partial index where NOT NULL
    Prerequisite chain traversal for skill unlock logic.

  ### studentSkillMastery
  - (studentId, masteryLevel)
    Dashboard and parent view: "show skills this student has mastered / is practicing"

  ### practiceSessions
  - (studentId, status)
    Prevents starting duplicate in-progress sessions:
    "does student X have any active session?"
  - (studentId, createdAt DESC)
    Session history listing.

  ### studentDailyStats
  - (studentId, date DESC)
    Daily stats lookup for streak and goal tracking.
    Complements the UNIQUE constraint added in migration 1.

  ### auditLog
  - (adminId, createdAt DESC)
    Admin audit trail: "show all actions by admin X, newest first"

  ### mathSkills
  - (gradeLevel, isActive)
    Grade-filtered skill browsing in the skill map.
*/

-- ── problemAttempts ────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_problemAttempts_studentId_createdAt"
  ON "problemAttempts"("studentId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "idx_problemAttempts_skillId_isCorrect"
  ON "problemAttempts"("skillId", "isCorrect");

CREATE INDEX IF NOT EXISTS "idx_problemAttempts_sessionId_createdAt"
  ON "problemAttempts"("sessionId", "createdAt");

-- ── mathProblems ───────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_mathProblems_skillId_isActive"
  ON "mathProblems"("skillId", "isActive");

-- ── mathSkills ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_mathSkills_domainId_isActive"
  ON "mathSkills"("domainId", "isActive");

CREATE INDEX IF NOT EXISTS "idx_mathSkills_prerequisiteSkillId"
  ON "mathSkills"("prerequisiteSkillId")
  WHERE "prerequisiteSkillId" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_mathSkills_gradeLevel_isActive"
  ON "mathSkills"("gradeLevel", "isActive");

-- ── studentSkillMastery ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_studentSkillMastery_studentId_masteryLevel"
  ON "studentSkillMastery"("studentId", "masteryLevel");

-- ── practiceSessions ───────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_practiceSessions_studentId_status"
  ON "practiceSessions"("studentId", status);

CREATE INDEX IF NOT EXISTS "idx_practiceSessions_studentId_createdAt"
  ON "practiceSessions"("studentId", "createdAt" DESC);

-- ── studentDailyStats ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_studentDailyStats_studentId_date"
  ON "studentDailyStats"("studentId", "date" DESC);

-- ── auditLog ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "idx_auditLog_adminId_createdAt"
  ON "auditLog"("adminId", "createdAt" DESC);
