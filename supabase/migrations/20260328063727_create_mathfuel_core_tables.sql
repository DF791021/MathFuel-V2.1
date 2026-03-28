/*
  # MathFuel Core Tables Migration

  Creates all application tables for the MathFuel math learning platform.

  ## New Tables
  1. `users` - Core user accounts (students, parents, teachers, admins)
  2. `mathDomains` - Top-level math categories (Number Sense, Operations, etc.)
  3. `mathSkills` - Skills within domains (Addition within 10, etc.)
  4. `mathProblems` - Problem templates for generating questions
  5. `practiceSessions` - A single sitting of math practice
  6. `problemAttempts` - Individual problem attempts within sessions
  7. `studentSkillMastery` - Per-skill progress tracking per student
  8. `studentDailyStats` - Aggregated daily performance stats
  9. `studentStreaks` - Daily practice streak tracking
  10. `studentBadges` - Achievement badges earned by students
  11. `parentStudentLinks` - Parent-child relationships
  12. `inviteCodes` - Codes for parent-child linking
  13. `passwordResetTokens` - Password reset token storage
  14. `aiFeedback` - Student ratings of AI hints/explanations
  15. `subscriptions` - Stripe subscription ledger
  16. `adminSettings` - Key-value admin configuration
  17. `featureFlags` - Feature flag management
  18. `auditLog` - Admin action audit trail
  19. `webhookEvents` - Idempotent webhook event processing
  20. `emailSends` - Email delivery tracking
  21. `notifications` - Admin notifications
  22. `permissions` - RBAC permissions
  23. `referralCodes` - Unique shareable referral codes
  24. `referrals` - Individual referral records

  ## Security
  - RLS enabled on all tables
  - Service role has full access (server-side app uses service role key)
  - Application-layer authorization handled by tRPC middleware

  ## Notes
  - Converted from MySQL to PostgreSQL (app uses drizzle with mysql2 currently)
  - JSONB used instead of JSON for better indexing
  - Timestamps use TIMESTAMPTZ for timezone awareness
  - Update triggers handle updatedAt columns automatically
*/

-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('student', 'parent', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE problem_type AS ENUM ('multiple_choice','numeric_input','true_false','fill_blank','comparison','word_problem','ordering');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE answer_type AS ENUM ('number','text','boolean','choice');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE session_type AS ENUM ('daily','practice','review','assessment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('in_progress','completed','abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mastery_level AS ENUM ('not_started','practicing','close','mastered');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_response_type AS ENUM ('hint','explanation','session_summary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE ai_rating AS ENUM ('up','down');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('trialing','active','incomplete','incomplete_expired','past_due','canceled','unpaid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('succeeded','failed','pending');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE setting_type AS ENUM ('boolean','string','number','json');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE webhook_status AS ENUM ('pending','succeeded','failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE email_status AS ENUM ('pending','sent','failed','bounced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('payment_received','payment_failed','subscription_change','new_signup','system_alert','content_update');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE referral_status AS ENUM ('signed_up','subscribed','rewarded','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- HELPER: auto-update updatedAt trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  "passwordHash" VARCHAR(255),
  role user_role NOT NULL DEFAULT 'user',
  "userType" user_type NOT NULL DEFAULT 'student',
  "avatarUrl" VARCHAR(500),
  "gradeLevel" INTEGER,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to users"
  ON users FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert users"
  ON users FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update users"
  ON users FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete users"
  ON users FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MATH DOMAINS
-- ============================================================

CREATE TABLE IF NOT EXISTS "mathDomains" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "gradeLevel" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "mathDomains" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to mathDomains"
  ON "mathDomains" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert mathDomains"
  ON "mathDomains" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update mathDomains"
  ON "mathDomains" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete mathDomains"
  ON "mathDomains" FOR DELETE TO service_role USING (true);

-- ============================================================
-- MATH SKILLS
-- ============================================================

CREATE TABLE IF NOT EXISTS "mathSkills" (
  id SERIAL PRIMARY KEY,
  "domainId" INTEGER NOT NULL REFERENCES "mathDomains"(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  description TEXT,
  "gradeLevel" INTEGER NOT NULL,
  "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "prerequisiteSkillId" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "mathSkills" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to mathSkills"
  ON "mathSkills" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert mathSkills"
  ON "mathSkills" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update mathSkills"
  ON "mathSkills" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete mathSkills"
  ON "mathSkills" FOR DELETE TO service_role USING (true);

-- ============================================================
-- MATH PROBLEMS
-- ============================================================

CREATE TABLE IF NOT EXISTS "mathProblems" (
  id SERIAL PRIMARY KEY,
  "skillId" INTEGER NOT NULL REFERENCES "mathSkills"(id),
  "problemType" problem_type NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 1,
  "questionText" TEXT NOT NULL,
  "questionImage" VARCHAR(500),
  "correctAnswer" VARCHAR(200) NOT NULL,
  "answerType" answer_type NOT NULL,
  choices JSONB,
  explanation TEXT NOT NULL,
  "hintSteps" JSONB NOT NULL DEFAULT '[]',
  tags VARCHAR(500),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "timesServed" INTEGER NOT NULL DEFAULT 0,
  "timesCorrect" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "mathProblems" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to mathProblems"
  ON "mathProblems" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert mathProblems"
  ON "mathProblems" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update mathProblems"
  ON "mathProblems" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete mathProblems"
  ON "mathProblems" FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_math_problems_updated_at
  BEFORE UPDATE ON "mathProblems"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- PRACTICE SESSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS "practiceSessions" (
  id SERIAL PRIMARY KEY,
  "studentId" INTEGER NOT NULL REFERENCES users(id),
  "sessionType" session_type NOT NULL DEFAULT 'daily',
  status session_status NOT NULL DEFAULT 'in_progress',
  "totalProblems" INTEGER NOT NULL DEFAULT 0,
  "correctAnswers" INTEGER NOT NULL DEFAULT 0,
  "hintsUsed" INTEGER NOT NULL DEFAULT 0,
  "totalTimeSeconds" INTEGER NOT NULL DEFAULT 0,
  "averageDifficulty" INTEGER NOT NULL DEFAULT 1,
  "skillsFocused" JSONB,
  "startedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "practiceSessions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to practiceSessions"
  ON "practiceSessions" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert practiceSessions"
  ON "practiceSessions" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update practiceSessions"
  ON "practiceSessions" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete practiceSessions"
  ON "practiceSessions" FOR DELETE TO service_role USING (true);

-- ============================================================
-- PROBLEM ATTEMPTS
-- ============================================================

CREATE TABLE IF NOT EXISTS "problemAttempts" (
  id SERIAL PRIMARY KEY,
  "sessionId" INTEGER NOT NULL REFERENCES "practiceSessions"(id),
  "studentId" INTEGER NOT NULL REFERENCES users(id),
  "problemId" INTEGER NOT NULL REFERENCES "mathProblems"(id),
  "skillId" INTEGER NOT NULL REFERENCES "mathSkills"(id),
  "studentAnswer" VARCHAR(200),
  "isCorrect" BOOLEAN NOT NULL,
  "isFirstTry" BOOLEAN NOT NULL DEFAULT true,
  "hintsViewed" INTEGER NOT NULL DEFAULT 0,
  "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
  difficulty INTEGER NOT NULL,
  "attemptNumber" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "problemAttempts" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to problemAttempts"
  ON "problemAttempts" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert problemAttempts"
  ON "problemAttempts" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update problemAttempts"
  ON "problemAttempts" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete problemAttempts"
  ON "problemAttempts" FOR DELETE TO service_role USING (true);

-- ============================================================
-- STUDENT SKILL MASTERY
-- ============================================================

CREATE TABLE IF NOT EXISTS "studentSkillMastery" (
  id SERIAL PRIMARY KEY,
  "studentId" INTEGER NOT NULL REFERENCES users(id),
  "skillId" INTEGER NOT NULL REFERENCES "mathSkills"(id),
  "masteryLevel" mastery_level NOT NULL DEFAULT 'not_started',
  "masteryScore" INTEGER NOT NULL DEFAULT 0,
  "totalAttempts" INTEGER NOT NULL DEFAULT 0,
  "correctAttempts" INTEGER NOT NULL DEFAULT 0,
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "bestStreak" INTEGER NOT NULL DEFAULT 0,
  "averageTimeSeconds" INTEGER NOT NULL DEFAULT 0,
  "lastPracticedAt" TIMESTAMPTZ,
  "masteredAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "studentSkillMastery" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to studentSkillMastery"
  ON "studentSkillMastery" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert studentSkillMastery"
  ON "studentSkillMastery" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update studentSkillMastery"
  ON "studentSkillMastery" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete studentSkillMastery"
  ON "studentSkillMastery" FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_student_skill_mastery_updated_at
  BEFORE UPDATE ON "studentSkillMastery"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STUDENT DAILY STATS
-- ============================================================

CREATE TABLE IF NOT EXISTS "studentDailyStats" (
  id SERIAL PRIMARY KEY,
  "studentId" INTEGER NOT NULL REFERENCES users(id),
  date VARCHAR(10) NOT NULL,
  "sessionsCompleted" INTEGER NOT NULL DEFAULT 0,
  "problemsAttempted" INTEGER NOT NULL DEFAULT 0,
  "problemsCorrect" INTEGER NOT NULL DEFAULT 0,
  "hintsUsed" INTEGER NOT NULL DEFAULT 0,
  "totalTimeSeconds" INTEGER NOT NULL DEFAULT 0,
  "skillsImproved" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "studentDailyStats" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to studentDailyStats"
  ON "studentDailyStats" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert studentDailyStats"
  ON "studentDailyStats" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update studentDailyStats"
  ON "studentDailyStats" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete studentDailyStats"
  ON "studentDailyStats" FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_student_daily_stats_updated_at
  BEFORE UPDATE ON "studentDailyStats"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STUDENT STREAKS
-- ============================================================

CREATE TABLE IF NOT EXISTS "studentStreaks" (
  id SERIAL PRIMARY KEY,
  "studentId" INTEGER NOT NULL UNIQUE REFERENCES users(id),
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  "lastActiveDate" VARCHAR(10),
  "totalActiveDays" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "studentStreaks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to studentStreaks"
  ON "studentStreaks" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert studentStreaks"
  ON "studentStreaks" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update studentStreaks"
  ON "studentStreaks" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete studentStreaks"
  ON "studentStreaks" FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_student_streaks_updated_at
  BEFORE UPDATE ON "studentStreaks"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STUDENT BADGES
-- ============================================================

CREATE TABLE IF NOT EXISTS "studentBadges" (
  id SERIAL PRIMARY KEY,
  "studentId" INTEGER NOT NULL REFERENCES users(id),
  "badgeType" VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  "earnedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "studentBadges" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to studentBadges"
  ON "studentBadges" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert studentBadges"
  ON "studentBadges" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update studentBadges"
  ON "studentBadges" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete studentBadges"
  ON "studentBadges" FOR DELETE TO service_role USING (true);

-- ============================================================
-- PARENT-STUDENT LINKS
-- ============================================================

CREATE TABLE IF NOT EXISTS "parentStudentLinks" (
  id SERIAL PRIMARY KEY,
  "parentId" INTEGER NOT NULL REFERENCES users(id),
  "studentId" INTEGER NOT NULL REFERENCES users(id),
  relationship VARCHAR(50) NOT NULL DEFAULT 'parent',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "parentStudentLinks" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to parentStudentLinks"
  ON "parentStudentLinks" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert parentStudentLinks"
  ON "parentStudentLinks" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update parentStudentLinks"
  ON "parentStudentLinks" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete parentStudentLinks"
  ON "parentStudentLinks" FOR DELETE TO service_role USING (true);

-- ============================================================
-- INVITE CODES
-- ============================================================

CREATE TABLE IF NOT EXISTS "inviteCodes" (
  id SERIAL PRIMARY KEY,
  "studentId" INTEGER NOT NULL REFERENCES users(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedBy" INTEGER,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "inviteCodes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to inviteCodes"
  ON "inviteCodes" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert inviteCodes"
  ON "inviteCodes" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update inviteCodes"
  ON "inviteCodes" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete inviteCodes"
  ON "inviteCodes" FOR DELETE TO service_role USING (true);

-- ============================================================
-- PASSWORD RESET TOKENS
-- ============================================================

CREATE TABLE IF NOT EXISTS "passwordResetTokens" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  token VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "usedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "passwordResetTokens" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to passwordResetTokens"
  ON "passwordResetTokens" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert passwordResetTokens"
  ON "passwordResetTokens" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update passwordResetTokens"
  ON "passwordResetTokens" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete passwordResetTokens"
  ON "passwordResetTokens" FOR DELETE TO service_role USING (true);

-- ============================================================
-- AI FEEDBACK
-- ============================================================

CREATE TABLE IF NOT EXISTS "aiFeedback" (
  id SERIAL PRIMARY KEY,
  "studentId" INTEGER NOT NULL REFERENCES users(id),
  "sessionId" INTEGER REFERENCES "practiceSessions"(id),
  "problemId" INTEGER REFERENCES "mathProblems"(id),
  "responseType" ai_response_type NOT NULL,
  rating ai_rating NOT NULL,
  "aiResponseText" TEXT,
  comment TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "aiFeedback" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to aiFeedback"
  ON "aiFeedback" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert aiFeedback"
  ON "aiFeedback" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update aiFeedback"
  ON "aiFeedback" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete aiFeedback"
  ON "aiFeedback" FOR DELETE TO service_role USING (true);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  "stripeCustomerId" VARCHAR(100) NOT NULL UNIQUE,
  "stripeSubscriptionId" VARCHAR(100) NOT NULL UNIQUE,
  status subscription_status NOT NULL,
  "priceId" VARCHAR(100) NOT NULL,
  "currentPeriodStart" TIMESTAMPTZ NOT NULL,
  "currentPeriodEnd" TIMESTAMPTZ NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "canceledAt" TIMESTAMPTZ,
  "latestInvoiceId" VARCHAR(100),
  "lastPaymentStatus" payment_status,
  "lastWebhookEventId" VARCHAR(100),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to subscriptions"
  ON subscriptions FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert subscriptions"
  ON subscriptions FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update subscriptions"
  ON subscriptions FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete subscriptions"
  ON subscriptions FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ADMIN SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS "adminSettings" (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  type setting_type NOT NULL,
  description TEXT,
  "updatedBy" INTEGER NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "adminSettings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to adminSettings"
  ON "adminSettings" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert adminSettings"
  ON "adminSettings" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update adminSettings"
  ON "adminSettings" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete adminSettings"
  ON "adminSettings" FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON "adminSettings"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FEATURE FLAGS
-- ============================================================

CREATE TABLE IF NOT EXISTS "featureFlags" (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT false,
  owner VARCHAR(100) NOT NULL,
  "rolloutPercentage" INTEGER NOT NULL DEFAULT 0,
  "targetRoles" VARCHAR(255),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "featureFlags" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to featureFlags"
  ON "featureFlags" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert featureFlags"
  ON "featureFlags" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update featureFlags"
  ON "featureFlags" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete featureFlags"
  ON "featureFlags" FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON "featureFlags"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS "auditLog" (
  id SERIAL PRIMARY KEY,
  "adminId" INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  "resourceType" VARCHAR(50) NOT NULL,
  "resourceId" VARCHAR(100),
  changes JSONB,
  metadata JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "auditLog" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to auditLog"
  ON "auditLog" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert auditLog"
  ON "auditLog" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update auditLog"
  ON "auditLog" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete auditLog"
  ON "auditLog" FOR DELETE TO service_role USING (true);

-- ============================================================
-- WEBHOOK EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS "webhookEvents" (
  id SERIAL PRIMARY KEY,
  "externalId" VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(100) NOT NULL,
  status webhook_status NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  "maxRetries" INTEGER NOT NULL DEFAULT 3,
  "nextRetryAt" TIMESTAMPTZ,
  "lastAttemptAt" TIMESTAMPTZ,
  "succeededAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "webhookEvents" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to webhookEvents"
  ON "webhookEvents" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert webhookEvents"
  ON "webhookEvents" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update webhookEvents"
  ON "webhookEvents" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete webhookEvents"
  ON "webhookEvents" FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_webhook_events_updated_at
  BEFORE UPDATE ON "webhookEvents"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- EMAIL SENDS
-- ============================================================

CREATE TABLE IF NOT EXISTS "emailSends" (
  id SERIAL PRIMARY KEY,
  "recipientEmail" VARCHAR(320) NOT NULL,
  "recipientUserId" INTEGER,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status email_status NOT NULL DEFAULT 'pending',
  "externalId" VARCHAR(100),
  error TEXT,
  "sentAt" TIMESTAMPTZ,
  "openedAt" TIMESTAMPTZ,
  "clickedAt" TIMESTAMPTZ,
  "bouncedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "emailSends" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to emailSends"
  ON "emailSends" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert emailSends"
  ON "emailSends" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update emailSends"
  ON "emailSends" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete emailSends"
  ON "emailSends" FOR DELETE TO service_role USING (true);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  type notification_type NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  "linkUrl" VARCHAR(500),
  metadata JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "readAt" TIMESTAMPTZ,
  "dismissedAt" TIMESTAMPTZ
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to notifications"
  ON notifications FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert notifications"
  ON notifications FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update notifications"
  ON notifications FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete notifications"
  ON notifications FOR DELETE TO service_role USING (true);

-- ============================================================
-- PERMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  role VARCHAR(50) NOT NULL,
  capability VARCHAR(100) NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to permissions"
  ON permissions FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert permissions"
  ON permissions FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update permissions"
  ON permissions FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete permissions"
  ON permissions FOR DELETE TO service_role USING (true);

-- ============================================================
-- REFERRAL CODES
-- ============================================================

CREATE TABLE IF NOT EXISTS "referralCodes" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  "totalReferrals" INTEGER NOT NULL DEFAULT 0,
  "totalRewardMonths" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "referralCodes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to referralCodes"
  ON "referralCodes" FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert referralCodes"
  ON "referralCodes" FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update referralCodes"
  ON "referralCodes" FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete referralCodes"
  ON "referralCodes" FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON "referralCodes"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- REFERRALS
-- ============================================================

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  "referrerUserId" INTEGER NOT NULL REFERENCES users(id),
  "refereeUserId" INTEGER NOT NULL REFERENCES users(id),
  "referralCodeId" INTEGER NOT NULL REFERENCES "referralCodes"(id),
  status referral_status NOT NULL DEFAULT 'signed_up',
  "rewardAppliedAt" TIMESTAMPTZ,
  "stripeCouponId" VARCHAR(100),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to referrals"
  ON referrals FOR SELECT TO service_role USING (true);
CREATE POLICY "Service role insert referrals"
  ON referrals FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role update referrals"
  ON referrals FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role delete referrals"
  ON referrals FOR DELETE TO service_role USING (true);

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users("openId");
CREATE INDEX IF NOT EXISTS idx_math_skills_domain ON "mathSkills"("domainId");
CREATE INDEX IF NOT EXISTS idx_math_problems_skill ON "mathProblems"("skillId");
CREATE INDEX IF NOT EXISTS idx_practice_sessions_student ON "practiceSessions"("studentId");
CREATE INDEX IF NOT EXISTS idx_problem_attempts_session ON "problemAttempts"("sessionId");
CREATE INDEX IF NOT EXISTS idx_problem_attempts_student ON "problemAttempts"("studentId");
CREATE INDEX IF NOT EXISTS idx_student_skill_mastery_student ON "studentSkillMastery"("studentId");
CREATE INDEX IF NOT EXISTS idx_student_skill_mastery_skill ON "studentSkillMastery"("skillId");
CREATE INDEX IF NOT EXISTS idx_student_daily_stats_student_date ON "studentDailyStats"("studentId", date);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON "parentStudentLinks"("parentId");
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON "parentStudentLinks"("studentId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals("referrerUserId");
