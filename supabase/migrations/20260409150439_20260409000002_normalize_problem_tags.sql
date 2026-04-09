/*
  # Normalize Problem Tags

  ## Problem
  mathProblems.tags stores comma-separated tag strings (e.g. "addition,word-problem").
  This makes it impossible to efficiently query "all problems with tag X" without
  expensive string matching, and breaks indexing.

  ## Solution
  Create a proper many-to-many relationship:

  ### New Table: tags
  - id          serial PRIMARY KEY
  - name        varchar(100) UNIQUE NOT NULL  — display name e.g. "Word Problems"
  - slug        varchar(100) UNIQUE NOT NULL  — URL-safe key e.g. "word-problems"
  - createdAt   timestamptz

  ### New Table: problemTags (junction)
  - problemId   integer FK → mathProblems (CASCADE DELETE)
  - tagId       integer FK → tags (CASCADE DELETE)
  - PRIMARY KEY (problemId, tagId)

  ## Data Migration
  Parses existing mathProblems.tags comma-separated values, inserts tag records,
  and creates junction rows. The original tags column is left in place for
  backward compatibility but is now considered deprecated.

  ## Indexes
  - idx_problemTags_problemId  — fast lookup of all tags for a problem
  - idx_problemTags_tagId      — fast lookup of all problems with a given tag

  ## Security
  - RLS enabled on both tables
  - service_role has full access
  - Authenticated users can SELECT tags (public content metadata)
*/

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Create tags lookup table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tags (
  id       serial PRIMARY KEY,
  name     varchar(100) NOT NULL,
  slug     varchar(100) NOT NULL UNIQUE,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_tags" ON tags;
CREATE POLICY "service_role_all_tags"
  ON tags FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_tags" ON tags;
CREATE POLICY "authenticated_read_tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create problemTags junction table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "problemTags" (
  "problemId" integer NOT NULL REFERENCES "mathProblems"(id) ON DELETE CASCADE,
  "tagId"     integer NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY ("problemId", "tagId")
);

ALTER TABLE "problemTags" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_problemTags" ON "problemTags";
CREATE POLICY "service_role_all_problemTags"
  ON "problemTags" FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read_problemTags" ON "problemTags";
CREATE POLICY "authenticated_read_problemTags"
  ON "problemTags" FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS "idx_problemTags_problemId"
  ON "problemTags"("problemId");

CREATE INDEX IF NOT EXISTS "idx_problemTags_tagId"
  ON "problemTags"("tagId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Migrate existing comma-separated tags data
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  rec       RECORD;
  raw_tag   TEXT;
  tag_slug  TEXT;
  tag_id    INTEGER;
BEGIN
  FOR rec IN
    SELECT id, tags
    FROM "mathProblems"
    WHERE tags IS NOT NULL AND trim(tags) <> ''
  LOOP
    FOREACH raw_tag IN ARRAY string_to_array(rec.tags, ',')
    LOOP
      raw_tag  := trim(raw_tag);
      IF raw_tag <> '' THEN
        tag_slug := lower(regexp_replace(raw_tag, '[^a-z0-9]+', '-', 'gi'));
        tag_slug := trim(both '-' FROM tag_slug);

        INSERT INTO tags (name, slug)
        VALUES (raw_tag, tag_slug)
        ON CONFLICT (slug) DO NOTHING;

        SELECT id INTO tag_id FROM tags WHERE slug = tag_slug LIMIT 1;

        INSERT INTO "problemTags" ("problemId", "tagId")
        VALUES (rec.id, tag_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;
