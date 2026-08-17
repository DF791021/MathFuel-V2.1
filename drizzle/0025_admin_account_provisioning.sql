ALTER TABLE "passwordResetTokens"
  ADD COLUMN IF NOT EXISTS "purpose" varchar(20) NOT NULL DEFAULT 'reset';
