/*
  # Normalize sessionSkills and featureFlagRoles

  ## Problems Fixed

  ### practiceSessions.skillsFocused (JSONB array)
  Storing skill IDs as a raw JSONB array means:
  - Cannot JOIN to mathSkills without unnesting
  - Cannot index individual skill references
  - Cannot enforce referential integrity

  ### featureFlags.targetRoles (comma-separated VARCHAR)
  Storing roles as a comma-separated string means:
  - Cannot efficiently query "flags enabled for role X"
  - Bypasses the user_type enum, allowing invalid values
  - No referential integrity

  ## New Table: sessionSkills
  Normalizes practiceSessions.skillsFocused into a proper junction table.

  - id          serial PRIMARY KEY
  - sessionId   integer FK → practiceSessions (CASCADE DELETE)
  - skillId     integer FK → mathSkills
  - createdAt   timestamptz
  - UNIQUE (sessionId, skillId)

  ## New Table: featureFlagRoles
  Normalizes featureFlags.targetRoles into a proper junction table.

  - id      serial PRIMARY KEY
  - flagId  integer FK → featureFlags (CASCADE DELETE)
  - role    user_type enum  — enforces valid values
  - UNIQUE (flagId, role)

  ## Data Migrations
  Both tables are populated from existing JSONB / CSV data automatically.
  Original columns (skillsFocused, targetRoles) are retained for backward
  compatibility but are now considered deprecated.

  ## Security
  - RLS enabled on both tables
  - service_role has full access
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. sessionSkills junction table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "sessionSkills" (
  id           serial PRIMARY KEY,
  "sessionId"  integer NOT NULL REFERENCES "practiceSessions"(id) ON DELETE CASCADE,
  "skillId"    integer NOT NULL REFERENCES "mathSkills"(id),
  "createdAt"  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "sessionSkills_sessionId_skillId_unique" UNIQUE ("sessionId", "skillId")
);

ALTER TABLE "sessionSkills" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_sessionSkills" ON "sessionSkills";
CREATE POLICY "service_role_all_sessionSkills"
  ON "sessionSkills" FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS "idx_sessionSkills_sessionId"
  ON "sessionSkills"("sessionId");

CREATE INDEX IF NOT EXISTS "idx_sessionSkills_skillId"
  ON "sessionSkills"("skillId");

-- Migrate existing JSONB skillsFocused arrays
DO $$
DECLARE
  rec       RECORD;
  skill_id  INTEGER;
BEGIN
  FOR rec IN
    SELECT id, "skillsFocused"
    FROM "practiceSessions"
    WHERE "skillsFocused" IS NOT NULL
      AND jsonb_typeof("skillsFocused") = 'array'
      AND jsonb_array_length("skillsFocused") > 0
  LOOP
    FOR skill_id IN
      SELECT (value::text)::integer
      FROM jsonb_array_elements_text(rec."skillsFocused")
    LOOP
      IF EXISTS (SELECT 1 FROM "mathSkills" WHERE id = skill_id) THEN
        INSERT INTO "sessionSkills" ("sessionId", "skillId")
        VALUES (rec.id, skill_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. featureFlagRoles junction table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "featureFlagRoles" (
  id       serial PRIMARY KEY,
  "flagId" integer NOT NULL REFERENCES "featureFlags"(id) ON DELETE CASCADE,
  role     user_type NOT NULL,
  CONSTRAINT "featureFlagRoles_flagId_role_unique" UNIQUE ("flagId", role)
);

ALTER TABLE "featureFlagRoles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_featureFlagRoles" ON "featureFlagRoles";
CREATE POLICY "service_role_all_featureFlagRoles"
  ON "featureFlagRoles" FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS "idx_featureFlagRoles_flagId"
  ON "featureFlagRoles"("flagId");

CREATE INDEX IF NOT EXISTS "idx_featureFlagRoles_role"
  ON "featureFlagRoles"(role);

-- Migrate existing comma-separated targetRoles data
DO $$
DECLARE
  rec       RECORD;
  role_raw  TEXT;
BEGIN
  FOR rec IN
    SELECT id, "targetRoles"
    FROM "featureFlags"
    WHERE "targetRoles" IS NOT NULL AND trim("targetRoles") <> ''
  LOOP
    FOREACH role_raw IN ARRAY string_to_array(rec."targetRoles", ',')
    LOOP
      role_raw := trim(role_raw);
      IF role_raw IN ('student', 'parent', 'teacher', 'admin') THEN
        INSERT INTO "featureFlagRoles" ("flagId", role)
        VALUES (rec.id, role_raw::user_type)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;
