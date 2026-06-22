/*
  # Fix Data Types, Missing UNIQUE Constraints, and Missing CHECK Constraints

  ## Purpose
  Addresses critical data integrity gaps found in the initial schema review.

  ## Data Type Fixes

  ### studentDailyStats.date
  - Changed from VARCHAR(10) to DATE
  - Enables proper date arithmetic, range queries, and sorting
  - Existing YYYY-MM-DD strings cast cleanly to DATE

  ### studentStreaks.lastActiveDate
  - Changed from VARCHAR(10) to DATE
  - Same reason as above

  ## New UNIQUE Constraints

  1. studentDailyStats(studentId, date)
     - Prevents duplicate daily stat rows for the same student on the same day
     - Without this, concurrent upserts could create corrupted duplicate rows

  2. parentStudentLinks(parentId, studentId)
     - Prevents a parent from being linked to the same child more than once
     - Duplicate links would skew parent dashboard data

  ## New CHECK Constraints

  1. mathProblems.difficulty — must be 1 to 5
     - Difficulty outside this range breaks the adaptive engine assumptions

  2. studentSkillMastery.masteryScore — must be 0 to 100
     - Score is treated as a percentage; negative or >100 values are nonsensical

  3. users.gradeLevel — must be 1 to 12 when not NULL
     - Prevents junk values; NULL is allowed for non-student accounts

  4. mathSkills.gradeLevel — must be 1 to 12
     - Skills must belong to a valid K-12 grade

  5. mathDomains.gradeLevel — must be 1 to 12
     - Domains must belong to a valid K-12 grade

  ## Notes
  - All ALTER TABLE operations use DO blocks with pg_constraint checks to be idempotent
  - Existing data is assumed valid (no conflicting rows expected in development)
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix studentDailyStats.date: VARCHAR(10) → DATE
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studentDailyStats'
      AND column_name = 'date'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE "studentDailyStats"
      ALTER COLUMN "date" TYPE DATE USING "date"::DATE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fix studentStreaks.lastActiveDate: VARCHAR(10) → DATE
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studentStreaks'
      AND column_name = 'lastActiveDate'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE "studentStreaks"
      ALTER COLUMN "lastActiveDate" TYPE DATE USING "lastActiveDate"::DATE;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. UNIQUE: studentDailyStats(studentId, date)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'studentDailyStats_studentId_date_unique'
  ) THEN
    ALTER TABLE "studentDailyStats"
      ADD CONSTRAINT "studentDailyStats_studentId_date_unique"
      UNIQUE ("studentId", "date");
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. UNIQUE: parentStudentLinks(parentId, studentId)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'parentStudentLinks_parentId_studentId_unique'
  ) THEN
    ALTER TABLE "parentStudentLinks"
      ADD CONSTRAINT "parentStudentLinks_parentId_studentId_unique"
      UNIQUE ("parentId", "studentId");
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. CHECK: mathProblems.difficulty between 1 and 5
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mathProblems_difficulty_range'
  ) THEN
    ALTER TABLE "mathProblems"
      ADD CONSTRAINT "mathProblems_difficulty_range"
      CHECK (difficulty BETWEEN 1 AND 5);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. CHECK: studentSkillMastery.masteryScore between 0 and 100
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'studentSkillMastery_masteryScore_range'
  ) THEN
    ALTER TABLE "studentSkillMastery"
      ADD CONSTRAINT "studentSkillMastery_masteryScore_range"
      CHECK ("masteryScore" BETWEEN 0 AND 100);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CHECK: users.gradeLevel between 1 and 12 (nullable)
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_gradeLevel_range'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT "users_gradeLevel_range"
      CHECK ("gradeLevel" IS NULL OR "gradeLevel" BETWEEN 1 AND 12);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. CHECK: mathSkills.gradeLevel between 1 and 12
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mathSkills_gradeLevel_range'
  ) THEN
    ALTER TABLE "mathSkills"
      ADD CONSTRAINT "mathSkills_gradeLevel_range"
      CHECK ("gradeLevel" BETWEEN 1 AND 12);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. CHECK: mathDomains.gradeLevel between 1 and 12
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mathDomains_gradeLevel_range'
  ) THEN
    ALTER TABLE "mathDomains"
      ADD CONSTRAINT "mathDomains_gradeLevel_range"
      CHECK ("gradeLevel" BETWEEN 1 AND 12);
  END IF;
END $$;
