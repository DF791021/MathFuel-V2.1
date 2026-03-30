import {
  pgTable, pgEnum,
  serial, integer, text, varchar, boolean, timestamp, jsonb,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const userTypeEnum = pgEnum("user_type", ["student", "parent", "teacher", "admin"]);
export const sessionTypeEnum = pgEnum("session_type", ["daily", "practice", "review", "assessment"]);
export const sessionStatusEnum = pgEnum("session_status", ["in_progress", "completed", "abandoned"]);
export const problemTypeEnum = pgEnum("problem_type", [
  "multiple_choice", "numeric_input", "true_false",
  "fill_blank", "comparison", "word_problem", "ordering",
]);
export const answerTypeEnum = pgEnum("answer_type", ["number", "text", "boolean", "choice"]);
export const masteryLevelEnum = pgEnum("mastery_level", ["not_started", "practicing", "close", "mastered"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing", "active", "incomplete", "incomplete_expired",
  "past_due", "canceled", "unpaid",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["succeeded", "failed", "pending"]);
export const settingTypeEnum = pgEnum("setting_type", ["boolean", "string", "number", "json"]);
export const webhookStatusEnum = pgEnum("webhook_status", ["pending", "succeeded", "failed"]);
export const emailStatusEnum = pgEnum("email_status", ["pending", "sent", "failed", "bounced"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "payment_received", "payment_failed", "subscription_change",
  "new_signup", "system_alert", "content_update",
]);
export const aiResponseTypeEnum = pgEnum("ai_response_type", ["hint", "explanation", "session_summary"]);
export const aiRatingEnum = pgEnum("ai_rating", ["up", "down"]);
export const referralStatusEnum = pgEnum("referral_status", [
  "signed_up", "subscribed", "rewarded", "expired",
]);

// ============================================================================
// CORE USER TABLE
// ============================================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: userRoleEnum("role").default("user").notNull(),
  userType: userTypeEnum("userType").default("student").notNull(),
  avatarUrl: varchar("avatarUrl", { length: 500 }),
  gradeLevel: integer("gradeLevel"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================================
// MATHFUEL CONTENT: SKILL TREE
// ============================================================================

export const mathDomains = pgTable("mathDomains", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  displayOrder: integer("displayOrder").notNull().default(0),
  gradeLevel: integer("gradeLevel").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type MathDomain = typeof mathDomains.$inferSelect;
export type InsertMathDomain = typeof mathDomains.$inferInsert;

export const mathSkills = pgTable("mathSkills", {
  id: serial("id").primaryKey(),
  domainId: integer("domainId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  gradeLevel: integer("gradeLevel").notNull(),
  displayOrder: integer("displayOrder").notNull().default(0),
  prerequisiteSkillId: integer("prerequisiteSkillId"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type MathSkill = typeof mathSkills.$inferSelect;
export type InsertMathSkill = typeof mathSkills.$inferInsert;

export const mathProblems = pgTable("mathProblems", {
  id: serial("id").primaryKey(),
  skillId: integer("skillId").notNull(),
  problemType: problemTypeEnum("problemType").notNull(),
  difficulty: integer("difficulty").notNull().default(1),
  questionText: text("questionText").notNull(),
  questionImage: varchar("questionImage", { length: 500 }),
  correctAnswer: varchar("correctAnswer", { length: 200 }).notNull(),
  answerType: answerTypeEnum("answerType").notNull(),
  choices: jsonb("choices"),
  explanation: text("explanation").notNull(),
  hintSteps: jsonb("hintSteps").notNull().default([]),
  tags: varchar("tags", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  timesServed: integer("timesServed").default(0).notNull(),
  timesCorrect: integer("timesCorrect").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type MathProblem = typeof mathProblems.$inferSelect;
export type InsertMathProblem = typeof mathProblems.$inferInsert;

// ============================================================================
// MATHFUEL: PRACTICE SESSIONS & STUDENT PERFORMANCE
// ============================================================================

export const practiceSessions = pgTable("practiceSessions", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  sessionType: sessionTypeEnum("sessionType").default("daily").notNull(),
  status: sessionStatusEnum("status").default("in_progress").notNull(),
  totalProblems: integer("totalProblems").default(0).notNull(),
  correctAnswers: integer("correctAnswers").default(0).notNull(),
  hintsUsed: integer("hintsUsed").default(0).notNull(),
  totalTimeSeconds: integer("totalTimeSeconds").default(0).notNull(),
  averageDifficulty: integer("averageDifficulty").default(1).notNull(),
  skillsFocused: jsonb("skillsFocused"),
  startedAt: timestamp("startedAt", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type PracticeSession = typeof practiceSessions.$inferSelect;
export type InsertPracticeSession = typeof practiceSessions.$inferInsert;

export const problemAttempts = pgTable("problemAttempts", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  studentId: integer("studentId").notNull(),
  problemId: integer("problemId").notNull(),
  skillId: integer("skillId").notNull(),
  studentAnswer: varchar("studentAnswer", { length: 200 }),
  isCorrect: boolean("isCorrect").notNull(),
  isFirstTry: boolean("isFirstTry").default(true).notNull(),
  hintsViewed: integer("hintsViewed").default(0).notNull(),
  timeSpentSeconds: integer("timeSpentSeconds").default(0).notNull(),
  difficulty: integer("difficulty").notNull(),
  attemptNumber: integer("attemptNumber").default(1).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ProblemAttempt = typeof problemAttempts.$inferSelect;
export type InsertProblemAttempt = typeof problemAttempts.$inferInsert;

export const studentSkillMastery = pgTable("studentSkillMastery", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  skillId: integer("skillId").notNull(),
  masteryLevel: masteryLevelEnum("masteryLevel").default("not_started").notNull(),
  masteryScore: integer("masteryScore").default(0).notNull(),
  totalAttempts: integer("totalAttempts").default(0).notNull(),
  correctAttempts: integer("correctAttempts").default(0).notNull(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  bestStreak: integer("bestStreak").default(0).notNull(),
  averageTimeSeconds: integer("averageTimeSeconds").default(0).notNull(),
  lastPracticedAt: timestamp("lastPracticedAt", { withTimezone: true }),
  masteredAt: timestamp("masteredAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type StudentSkillMastery = typeof studentSkillMastery.$inferSelect;
export type InsertStudentSkillMastery = typeof studentSkillMastery.$inferInsert;

export const studentDailyStats = pgTable("studentDailyStats", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  sessionsCompleted: integer("sessionsCompleted").default(0).notNull(),
  problemsAttempted: integer("problemsAttempted").default(0).notNull(),
  problemsCorrect: integer("problemsCorrect").default(0).notNull(),
  hintsUsed: integer("hintsUsed").default(0).notNull(),
  totalTimeSeconds: integer("totalTimeSeconds").default(0).notNull(),
  skillsImproved: integer("skillsImproved").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type StudentDailyStat = typeof studentDailyStats.$inferSelect;
export type InsertStudentDailyStat = typeof studentDailyStats.$inferInsert;

export const studentStreaks = pgTable("studentStreaks", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull().unique(),
  currentStreak: integer("currentStreak").default(0).notNull(),
  longestStreak: integer("longestStreak").default(0).notNull(),
  lastActiveDate: varchar("lastActiveDate", { length: 10 }),
  totalActiveDays: integer("totalActiveDays").default(0).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type StudentStreak = typeof studentStreaks.$inferSelect;
export type InsertStudentStreak = typeof studentStreaks.$inferInsert;

export const studentBadges = pgTable("studentBadges", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  badgeType: varchar("badgeType", { length: 100 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  earnedAt: timestamp("earnedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type StudentBadge = typeof studentBadges.$inferSelect;
export type InsertStudentBadge = typeof studentBadges.$inferInsert;

// ============================================================================
// MATHFUEL: PARENT-STUDENT LINKING
// ============================================================================

export const parentStudentLinks = pgTable("parentStudentLinks", {
  id: serial("id").primaryKey(),
  parentId: integer("parentId").notNull(),
  studentId: integer("studentId").notNull(),
  relationship: varchar("relationship", { length: 50 }).default("parent").notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ParentStudentLink = typeof parentStudentLinks.$inferSelect;
export type InsertParentStudentLink = typeof parentStudentLinks.$inferInsert;

// ============================================================================
// MATHFUEL: INVITE CODES
// ============================================================================

export const inviteCodes = pgTable("inviteCodes", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  usedBy: integer("usedBy"),
  usedAt: timestamp("usedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type InviteCode = typeof inviteCodes.$inferSelect;
export type InsertInviteCode = typeof inviteCodes.$inferInsert;

// ============================================================================
// MATHFUEL: PASSWORD RESET TOKENS
// ============================================================================

export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  usedAt: timestamp("usedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// ============================================================================
// MATHFUEL: AI FEEDBACK RATINGS
// ============================================================================

export const aiFeedback = pgTable("aiFeedback", {
  id: serial("id").primaryKey(),
  studentId: integer("studentId").notNull(),
  sessionId: integer("sessionId"),
  problemId: integer("problemId"),
  responseType: aiResponseTypeEnum("responseType").notNull(),
  rating: aiRatingEnum("rating").notNull(),
  aiResponseText: text("aiResponseText"),
  comment: text("comment"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type AIFeedback = typeof aiFeedback.$inferSelect;
export type InsertAIFeedback = typeof aiFeedback.$inferInsert;

// ============================================================================
// REVENUE ENGINE TABLES
// ============================================================================

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 100 }).notNull().unique(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 100 }).notNull().unique(),
  status: subscriptionStatusEnum("status").notNull(),
  priceId: varchar("priceId", { length: 100 }).notNull(),
  currentPeriodStart: timestamp("currentPeriodStart", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd", { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  canceledAt: timestamp("canceledAt", { withTimezone: true }),
  latestInvoiceId: varchar("latestInvoiceId", { length: 100 }),
  lastPaymentStatus: paymentStatusEnum("lastPaymentStatus"),
  lastWebhookEventId: varchar("lastWebhookEventId", { length: 100 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

export const adminSettings = pgTable("adminSettings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: jsonb("value").notNull(),
  type: settingTypeEnum("type").notNull(),
  description: text("description"),
  updatedBy: integer("updatedBy").notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = typeof adminSettings.$inferInsert;

export const featureFlags = pgTable("featureFlags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  enabled: boolean("enabled").default(false).notNull(),
  owner: varchar("owner", { length: 100 }).notNull(),
  rolloutPercentage: integer("rolloutPercentage").default(0).notNull(),
  targetRoles: varchar("targetRoles", { length: 255 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

export const auditLog = pgTable("auditLog", {
  id: serial("id").primaryKey(),
  adminId: integer("adminId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resourceType", { length: 50 }).notNull(),
  resourceId: varchar("resourceId", { length: 100 }),
  changes: jsonb("changes"),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;

export const webhookEvents = pgTable("webhookEvents", {
  id: serial("id").primaryKey(),
  externalId: varchar("externalId", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 100 }).notNull(),
  status: webhookStatusEnum("status").default("pending").notNull(),
  payload: jsonb("payload").notNull(),
  error: text("error"),
  attempts: integer("attempts").default(0).notNull(),
  maxRetries: integer("maxRetries").default(3).notNull(),
  nextRetryAt: timestamp("nextRetryAt", { withTimezone: true }),
  lastAttemptAt: timestamp("lastAttemptAt", { withTimezone: true }),
  succeededAt: timestamp("succeededAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;

export const emailSends = pgTable("emailSends", {
  id: serial("id").primaryKey(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientUserId: integer("recipientUserId"),
  type: varchar("type", { length: 50 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  status: emailStatusEnum("status").default("pending").notNull(),
  externalId: varchar("externalId", { length: 100 }),
  error: text("error"),
  sentAt: timestamp("sentAt", { withTimezone: true }),
  openedAt: timestamp("openedAt", { withTimezone: true }),
  clickedAt: timestamp("clickedAt", { withTimezone: true }),
  bouncedAt: timestamp("bouncedAt", { withTimezone: true }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type EmailSend = typeof emailSends.$inferSelect;
export type InsertEmailSend = typeof emailSends.$inferInsert;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  linkUrl: varchar("linkUrl", { length: 500 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  readAt: timestamp("readAt", { withTimezone: true }),
  dismissedAt: timestamp("dismissedAt", { withTimezone: true }),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
  capability: varchar("capability", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;

// ============================================================================
// MATHFUEL: REFERRAL PROGRAM
// ============================================================================

export const referralCodes = pgTable("referralCodes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  totalReferrals: integer("totalReferrals").default(0).notNull(),
  totalRewardMonths: integer("totalRewardMonths").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerUserId: integer("referrerUserId").notNull(),
  refereeUserId: integer("refereeUserId").notNull(),
  referralCodeId: integer("referralCodeId").notNull(),
  status: referralStatusEnum("status").default("signed_up").notNull(),
  rewardAppliedAt: timestamp("rewardAppliedAt", { withTimezone: true }),
  stripeCouponId: varchar("stripeCouponId", { length: 100 }),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;
