/*
  # Fix Unindexed Foreign Keys, Drop Unused Indexes, and Fix Function Search Path

  ## Summary
  This migration addresses three categories of security/performance issues:

  ### 1. Add Indexes for Unindexed Foreign Keys
  The following foreign key columns were missing covering indexes, which can cause
  full table scans on JOIN and DELETE operations:
  - aiFeedback: problemId, sessionId, studentId
  - inviteCodes: studentId
  - notifications: userId
  - passwordResetTokens: userId
  - problemAttempts: problemId, skillId
  - referrals: refereeUserId, referralCodeId
  - studentBadges: studentId

  ### 2. Drop Unused Indexes
  The following indexes have never been used and are consuming storage/write overhead:
  - idx_users_email, idx_users_open_id (users)
  - idx_math_skills_domain (mathSkills)
  - idx_math_problems_skill (mathProblems)
  - idx_practice_sessions_student (practiceSessions)
  - idx_problem_attempts_session, idx_problem_attempts_student (problemAttempts)
  - idx_student_skill_mastery_student, idx_student_skill_mastery_skill (studentSkillMastery)
  - idx_student_daily_stats_student_date (studentDailyStats)
  - idx_parent_student_links_parent, idx_parent_student_links_student (parentStudentLinks)
  - idx_subscriptions_user (subscriptions)
  - idx_referrals_referrer (referrals)

  ### 3. Fix Function Search Path
  The `update_updated_at_column` function had a mutable search_path, which is a
  security risk. Fixed by setting `search_path = ''` and using fully qualified
  references.
*/

-- ============================================================
-- 1. ADD INDEXES FOR UNINDEXED FOREIGN KEYS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ai_feedback_problem_id
  ON public."aiFeedback" ("problemId");

CREATE INDEX IF NOT EXISTS idx_ai_feedback_session_id
  ON public."aiFeedback" ("sessionId");

CREATE INDEX IF NOT EXISTS idx_ai_feedback_student_id
  ON public."aiFeedback" ("studentId");

CREATE INDEX IF NOT EXISTS idx_invite_codes_student_id
  ON public."inviteCodes" ("studentId");

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public."notifications" ("userId");

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id
  ON public."passwordResetTokens" ("userId");

CREATE INDEX IF NOT EXISTS idx_problem_attempts_problem_id
  ON public."problemAttempts" ("problemId");

CREATE INDEX IF NOT EXISTS idx_problem_attempts_skill_id
  ON public."problemAttempts" ("skillId");

CREATE INDEX IF NOT EXISTS idx_referrals_referee_user_id
  ON public."referrals" ("refereeUserId");

CREATE INDEX IF NOT EXISTS idx_referrals_referral_code_id
  ON public."referrals" ("referralCodeId");

CREATE INDEX IF NOT EXISTS idx_student_badges_student_id
  ON public."studentBadges" ("studentId");

-- ============================================================
-- 2. DROP UNUSED INDEXES
-- ============================================================

DROP INDEX IF EXISTS public.idx_users_email;
DROP INDEX IF EXISTS public.idx_users_open_id;
DROP INDEX IF EXISTS public.idx_math_skills_domain;
DROP INDEX IF EXISTS public.idx_math_problems_skill;
DROP INDEX IF EXISTS public.idx_practice_sessions_student;
DROP INDEX IF EXISTS public.idx_problem_attempts_session;
DROP INDEX IF EXISTS public.idx_problem_attempts_student;
DROP INDEX IF EXISTS public.idx_student_skill_mastery_student;
DROP INDEX IF EXISTS public.idx_student_skill_mastery_skill;
DROP INDEX IF EXISTS public.idx_student_daily_stats_student_date;
DROP INDEX IF EXISTS public.idx_parent_student_links_parent;
DROP INDEX IF EXISTS public.idx_parent_student_links_student;
DROP INDEX IF EXISTS public.idx_subscriptions_user;
DROP INDEX IF EXISTS public.idx_referrals_referrer;

-- ============================================================
-- 3. FIX FUNCTION SEARCH PATH (SECURITY)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
