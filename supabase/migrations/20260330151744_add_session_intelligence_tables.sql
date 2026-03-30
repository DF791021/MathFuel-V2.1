/*
  # Session Intelligence Layer Migration

  Adds the full adaptive learning observability and intelligence layer to MathFuel.

  ## New Columns on Existing Tables
  - `practiceSessions`: targetSkillId, engagementScore, confidenceScore, masterySnapshot
  - `problemAttempts`: sessionQuestionId, scoreQuality
  - `studentSkillMastery`: confidenceScore, masteryVersion

  ## New Tables
  1. `sessionQuestions` - Question serving log (what was shown, when, at what difficulty)
  2. `hintUsage` - Dedicated hint event tracking (per-hint-index granularity)
  3. `practiceEvents` - Structured event log (SESSION_STARTED, QUESTION_ANSWERED, etc.)
  4. `weeklyReports` - Generated weekly summaries for parent/student reporting
  5. `classrooms` - Teacher-owned classroom groups
  6. `classroomStudents` - Classroom membership

  ## Helper Functions
  - `mark_session_question_answered()` - Auto-marks session_questions when an attempt is logged
  - `refresh_session_aggregates()` - Recomputes session stats from attempts
  - `log_practice_event()` - Convenience insert into practiceEvents

  ## Security
  - RLS enabled on all new tables
  - Service role has full access

  ## Notes
  - Uses IF NOT EXISTS / IF EXISTS guards throughout for safe re-runs
  - scoreQuality encodes response speed + correctness + hint penalty
  - confidenceScore tracks student confidence separate from accuracy
*/

-- ============================================================
-- NEW ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE practice_event_type AS ENUM (
    'SESSION_STARTED',
    'QUESTION_SERVED',
    'QUESTION_ANSWERED',
    'HINT_USED',
    'LEVEL_ADJUSTED',
    'STRUGGLE_DETECTED',
    'SESSION_COMPLETED',
    'WEEKLY_REPORT_GENERATED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- EXTEND practiceSessions
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practiceSessions' AND column_name = 'targetSkillId'
  ) THEN
    ALTER TABLE "practiceSessions" ADD COLUMN "targetSkillId" integer REFERENCES "mathSkills"(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practiceSessions' AND column_name = 'engagementScore'
  ) THEN
    ALTER TABLE "practiceSessions" ADD COLUMN "engagementScore" numeric(5,4) CHECK ("engagementScore" BETWEEN 0 AND 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practiceSessions' AND column_name = 'confidenceScore'
  ) THEN
    ALTER TABLE "practiceSessions" ADD COLUMN "confidenceScore" numeric(5,4) DEFAULT 0.5000 CHECK ("confidenceScore" BETWEEN 0 AND 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practiceSessions' AND column_name = 'masterySnapshot'
  ) THEN
    ALTER TABLE "practiceSessions" ADD COLUMN "masterySnapshot" jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ============================================================
-- EXTEND problemAttempts
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'problemAttempts' AND column_name = 'sessionQuestionId'
  ) THEN
    ALTER TABLE "problemAttempts" ADD COLUMN "sessionQuestionId" integer;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'problemAttempts' AND column_name = 'scoreQuality'
  ) THEN
    ALTER TABLE "problemAttempts" ADD COLUMN "scoreQuality" numeric(5,4) CHECK ("scoreQuality" BETWEEN 0 AND 1);
  END IF;
END $$;

-- ============================================================
-- EXTEND studentSkillMastery
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studentSkillMastery' AND column_name = 'confidenceScore'
  ) THEN
    ALTER TABLE "studentSkillMastery" ADD COLUMN "confidenceScore" numeric(5,4) NOT NULL DEFAULT 0.5000 CHECK ("confidenceScore" BETWEEN 0 AND 1);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studentSkillMastery' AND column_name = 'masteryVersion'
  ) THEN
    ALTER TABLE "studentSkillMastery" ADD COLUMN "masteryVersion" integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- ============================================================
-- sessionQuestions TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS "sessionQuestions" (
  id serial PRIMARY KEY,
  "sessionId" integer NOT NULL REFERENCES "practiceSessions"(id) ON DELETE CASCADE,
  "studentId" integer NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "problemId" integer NOT NULL REFERENCES "mathProblems"(id) ON DELETE CASCADE,
  "skillId" integer NOT NULL REFERENCES "mathSkills"(id) ON DELETE CASCADE,
  "sequenceNumber" integer NOT NULL CHECK ("sequenceNumber" > 0),
  "servedDifficulty" integer NOT NULL,
  "wasAnswered" boolean NOT NULL DEFAULT false,
  "servedAt" timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("sessionId", "sequenceNumber")
);

CREATE INDEX IF NOT EXISTS "ix_sessionQuestions_sessionId" ON "sessionQuestions"("sessionId");
CREATE INDEX IF NOT EXISTS "ix_sessionQuestions_studentId" ON "sessionQuestions"("studentId");
CREATE INDEX IF NOT EXISTS "ix_sessionQuestions_problemId" ON "sessionQuestions"("problemId");

ALTER TABLE "sessionQuestions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_sessionQuestions" ON "sessionQuestions";
CREATE POLICY "service_role_full_access_sessionQuestions"
  ON "sessionQuestions" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- hintUsage TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS "hintUsage" (
  id serial PRIMARY KEY,
  "sessionId" integer NOT NULL REFERENCES "practiceSessions"(id) ON DELETE CASCADE,
  "sessionQuestionId" integer REFERENCES "sessionQuestions"(id) ON DELETE SET NULL,
  "studentId" integer NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "problemId" integer NOT NULL REFERENCES "mathProblems"(id) ON DELETE CASCADE,
  "hintIndex" integer NOT NULL DEFAULT 1 CHECK ("hintIndex" > 0),
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ix_hintUsage_sessionId" ON "hintUsage"("sessionId");
CREATE INDEX IF NOT EXISTS "ix_hintUsage_studentId" ON "hintUsage"("studentId");

ALTER TABLE "hintUsage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_hintUsage" ON "hintUsage";
CREATE POLICY "service_role_full_access_hintUsage"
  ON "hintUsage" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- practiceEvents TABLE (event log)
-- ============================================================

CREATE TABLE IF NOT EXISTS "practiceEvents" (
  id serial PRIMARY KEY,
  "studentId" integer REFERENCES "users"(id) ON DELETE SET NULL,
  "sessionId" integer REFERENCES "practiceSessions"(id) ON DELETE SET NULL,
  "eventType" practice_event_type NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ix_practiceEvents_studentId" ON "practiceEvents"("studentId");
CREATE INDEX IF NOT EXISTS "ix_practiceEvents_sessionId" ON "practiceEvents"("sessionId");
CREATE INDEX IF NOT EXISTS "ix_practiceEvents_eventType" ON "practiceEvents"("eventType");
CREATE INDEX IF NOT EXISTS "ix_practiceEvents_createdAt" ON "practiceEvents"("createdAt" DESC);

ALTER TABLE "practiceEvents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_practiceEvents" ON "practiceEvents";
CREATE POLICY "service_role_full_access_practiceEvents"
  ON "practiceEvents" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- weeklyReports TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS "weeklyReports" (
  id serial PRIMARY KEY,
  "studentId" integer NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "weekStart" date NOT NULL,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  "deliveredAt" timestamptz,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("studentId", "weekStart")
);

CREATE INDEX IF NOT EXISTS "ix_weeklyReports_studentId" ON "weeklyReports"("studentId");
CREATE INDEX IF NOT EXISTS "ix_weeklyReports_weekStart" ON "weeklyReports"("weekStart" DESC);

ALTER TABLE "weeklyReports" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_weeklyReports" ON "weeklyReports";
CREATE POLICY "service_role_full_access_weeklyReports"
  ON "weeklyReports" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- classrooms TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS "classrooms" (
  id serial PRIMARY KEY,
  name varchar(200) NOT NULL,
  "gradeLevel" integer CHECK ("gradeLevel" BETWEEN 1 AND 12),
  "schoolName" text,
  "teacherUserId" integer REFERENCES "users"(id) ON DELETE SET NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "ix_classrooms_teacherUserId" ON "classrooms"("teacherUserId");

ALTER TABLE "classrooms" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_classrooms" ON "classrooms";
CREATE POLICY "service_role_full_access_classrooms"
  ON "classrooms" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- classroomStudents TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS "classroomStudents" (
  id serial PRIMARY KEY,
  "classroomId" integer NOT NULL REFERENCES "classrooms"(id) ON DELETE CASCADE,
  "studentId" integer NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  "joinedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("classroomId", "studentId")
);

CREATE INDEX IF NOT EXISTS "ix_classroomStudents_classroomId" ON "classroomStudents"("classroomId");
CREATE INDEX IF NOT EXISTS "ix_classroomStudents_studentId" ON "classroomStudents"("studentId");

ALTER TABLE "classroomStudents" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_classroomStudents" ON "classroomStudents";
CREATE POLICY "service_role_full_access_classroomStudents"
  ON "classroomStudents" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- TRIGGER: auto-mark sessionQuestion answered on attempt insert
-- ============================================================

CREATE OR REPLACE FUNCTION mark_session_question_answered()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW."sessionQuestionId" IS NOT NULL THEN
    UPDATE "sessionQuestions"
    SET "wasAnswered" = true
    WHERE id = NEW."sessionQuestionId";
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trg_problemAttempts_mark_sq_answered" ON "problemAttempts";
CREATE TRIGGER "trg_problemAttempts_mark_sq_answered"
AFTER INSERT ON "problemAttempts"
FOR EACH ROW
EXECUTE FUNCTION mark_session_question_answered();

-- ============================================================
-- FUNCTION: refresh_session_aggregates
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_session_aggregates(p_session_id integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_correct integer;
  v_avg_time integer;
BEGIN
  SELECT
    COUNT(*)::integer,
    COALESCE(SUM(CASE WHEN "isCorrect" THEN 1 ELSE 0 END), 0)::integer,
    COALESCE(AVG("timeSpentSeconds"), 0)::integer
  INTO v_total, v_correct, v_avg_time
  FROM "problemAttempts"
  WHERE "sessionId" = p_session_id;

  UPDATE "practiceSessions"
  SET
    "totalProblems" = v_total,
    "correctAnswers" = v_correct,
    "totalTimeSeconds" = v_total * v_avg_time
  WHERE id = p_session_id;
END;
$$;

-- ============================================================
-- FUNCTION: log_practice_event (convenience helper)
-- ============================================================

CREATE OR REPLACE FUNCTION log_practice_event(
  p_student_id integer,
  p_session_id integer,
  p_event_type practice_event_type,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  INSERT INTO "practiceEvents" ("studentId", "sessionId", "eventType", payload)
  VALUES (p_student_id, p_session_id, p_event_type, COALESCE(p_payload, '{}'::jsonb));
$$;

-- ============================================================
-- UPDATED_AT trigger for classrooms
-- ============================================================

DROP TRIGGER IF EXISTS "trg_classrooms_updated_at" ON "classrooms";
CREATE TRIGGER "trg_classrooms_updated_at"
BEFORE UPDATE ON "classrooms"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
