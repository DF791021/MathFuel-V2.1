/*
  # Seed default operational data

  ## Purpose
  Populates three configuration tables that should have data before any
  users register. These control platform behavior from day one.

  ## Tables seeded

  ### adminSettings
  - Platform-wide settings: maintenance mode, registration toggle,
    session length, AI feedback, referral rewards, daily goal, etc.
  - updatedBy uses 0 as a sentinel for "system default" (no FK constraint).

  ### featureFlags
  - Defines which features are enabled at launch vs. gated behind a flag.

  ### permissions
  - Role-capability matrix for student, parent, teacher, and admin.

  ## Notes
  - ON CONFLICT DO NOTHING makes this safe to re-run.
*/

-- ─────────────────────────────────────────
-- adminSettings
-- ─────────────────────────────────────────
INSERT INTO "adminSettings" (key, value, type, description, "updatedBy") VALUES
  ('maintenance_mode',       'false', 'boolean', 'Put the platform in read-only maintenance mode', 0),
  ('registration_open',      'true',  'boolean', 'Allow new user registrations',                   0),
  ('max_hints_per_problem',  '3',     'number',  'Maximum hints a student can request per problem', 0),
  ('default_session_length', '10',    'number',  'Default number of problems per practice session', 0),
  ('ai_feedback_enabled',    'true',  'boolean', 'Enable AI-generated feedback on answers',         0),
  ('referral_reward_days',   '7',     'number',  'Free premium days awarded for a successful referral', 0),
  ('default_daily_goal',     '5',     'number',  'Default daily practice goal (problems)',          0),
  ('leaderboard_enabled',    'true',  'boolean', 'Show the public leaderboard',                     0),
  ('weekly_report_enabled',  'true',  'boolean', 'Send weekly progress reports to parents',         0),
  ('invite_only_mode',       'false', 'boolean', 'Require an invite code to register',              0)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- featureFlags
-- ─────────────────────────────────────────
INSERT INTO "featureFlags" (name, description, enabled, owner, "rolloutPercentage", "targetRoles") VALUES
  ('ai_tutor',               'AI-powered step-by-step tutoring assistant',    true,  'product', 100, 'student'),
  ('adaptive_engine',        'Adaptive difficulty selection engine',           true,  'product', 100, 'student'),
  ('leaderboard',            'Weekly and all-time leaderboard',                true,  'product', 100, 'student,teacher'),
  ('referral_program',       'Refer-a-friend program with reward codes',       true,  'product', 100, 'student,parent'),
  ('parent_dashboard',       'Parent progress monitoring dashboard',           true,  'product', 100, 'parent'),
  ('teacher_dashboard',      'Teacher classroom management dashboard',         true,  'product', 100, 'teacher'),
  ('badges_and_achievements','Achievement badges for milestones',              true,  'product', 100, 'student'),
  ('streak_tracking',        'Daily practice streak counter',                  true,  'product', 100, 'student'),
  ('voice_input',            'Voice transcription for answering problems',     false, 'product',   0, 'student'),
  ('streak_freeze',          'Streak freeze power-up to protect streaks',      false, 'product',   0, 'student'),
  ('classroom_tools',        'Create and manage classrooms',                   true,  'product', 100, 'teacher'),
  ('weekly_reports',         'Automated weekly email reports',                 true,  'product', 100, 'parent'),
  ('hint_system',            'Contextual hints during practice sessions',      true,  'product', 100, 'student'),
  ('skill_map',              'Visual skill progression map',                   true,  'product', 100, 'student'),
  ('payment_subscriptions',  'Paid subscription tiers via Stripe',             true,  'product', 100, 'student,parent')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────
-- permissions
-- ─────────────────────────────────────────
INSERT INTO permissions (role, capability, description) VALUES
  ('student', 'start_session',         'Start a new practice session'),
  ('student', 'submit_answer',         'Submit an answer to a problem'),
  ('student', 'request_hint',          'Request a hint during a session'),
  ('student', 'view_own_progress',     'View own mastery and progress data'),
  ('student', 'view_leaderboard',      'View the public leaderboard'),
  ('student', 'view_skill_map',        'View the skill progression map'),
  ('student', 'manage_own_profile',    'Edit own display name and settings'),
  ('student', 'use_referral',          'Generate and share referral codes'),

  ('parent',  'view_child_progress',   'View linked child progress and reports'),
  ('parent',  'view_weekly_reports',   'Receive and view weekly summary reports'),
  ('parent',  'link_child_account',    'Link a child student account'),
  ('parent',  'manage_subscription',   'Manage billing and subscription'),

  ('teacher', 'view_class_dashboard',  'View class-level performance dashboard'),
  ('teacher', 'view_student_mastery',  'View individual student mastery data'),
  ('teacher', 'create_classroom',      'Create and name a classroom'),
  ('teacher', 'add_student_to_class',  'Add a student to a classroom'),
  ('teacher', 'remove_student',        'Remove a student from a classroom'),
  ('teacher', 'view_engagement_data',  'View student engagement and session logs'),

  ('admin',   'manage_users',          'Create, update, and deactivate user accounts'),
  ('admin',   'manage_content',        'Add, edit, and remove problems and skills'),
  ('admin',   'manage_admin_settings', 'Update platform-wide admin settings'),
  ('admin',   'manage_feature_flags',  'Toggle and configure feature flags'),
  ('admin',   'view_audit_log',        'View the full system audit log'),
  ('admin',   'view_system_health',    'Access system health and metrics dashboards'),
  ('admin',   'manage_invite_codes',   'Create and revoke invite codes'),
  ('admin',   'view_all_data',         'Read-only access to all platform data'),
  ('admin',   'impersonate_user',      'Log in as another user for support purposes')
ON CONFLICT DO NOTHING;
