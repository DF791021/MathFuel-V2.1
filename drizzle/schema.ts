import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with userType for student/teacher/admin distinction.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["student", "teacher", "admin"]).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Game scores / leaderboard entries
 */
export const gameScores = mysqlTable("gameScores", {
  id: int("id").autoincrement().primaryKey(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  score: int("score").notNull().default(0),
  totalQuestions: int("totalQuestions").notNull().default(0),
  correctAnswers: int("correctAnswers").notNull().default(0),
  playedAt: timestamp("playedAt").defaultNow().notNull(),
  userId: int("userId"),
});

export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = typeof gameScores.$inferInsert;

/**
 * Custom challenge questions created by teachers
 */
export const customQuestions = mysqlTable("customQuestions", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 50 }).notNull(),
  questionType: mysqlEnum("questionType", ["question", "activity"]).default("question").notNull(),
  question: text("question").notNull(),
  answer: text("answer"),
  createdBy: int("createdBy").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomQuestion = typeof customQuestions.$inferSelect;
export type InsertCustomQuestion = typeof customQuestions.$inferInsert;

/**
 * Classes/groups for teachers to organize students
 */
export const classes = mysqlTable("classes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  joinCode: varchar("joinCode", { length: 10 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;

/**
 * Student-Class membership
 */
export const classMembers = mysqlTable("classMembers", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  studentId: int("studentId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ClassMember = typeof classMembers.$inferSelect;
export type InsertClassMember = typeof classMembers.$inferInsert;

/**
 * Saved email templates for certificates
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  achievementType: varchar("achievementType", { length: 50 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  teacherId: int("teacherId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Scheduled certificate emails
 */
export const scheduledEmails = mysqlTable("scheduledEmails", {
  id: int("id").autoincrement().primaryKey(),
  studentName: varchar("studentName", { length: 100 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  achievementType: varchar("achievementType", { length: 50 }).notNull(),
  teacherName: varchar("teacherName", { length: 100 }),
  schoolName: varchar("schoolName", { length: 200 }),
  customMessage: text("customMessage"),
  emailSubject: text("emailSubject").notNull(),
  emailBody: text("emailBody").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "cancelled", "failed"]).default("pending").notNull(),
  teacherId: int("teacherId").notNull(),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ScheduledEmail = typeof scheduledEmails.$inferSelect;
export type InsertScheduledEmail = typeof scheduledEmails.$inferInsert;

/**
 * Issued certificates with verification data
 */
export const issuedCertificates = mysqlTable("issuedCertificates", {
  id: int("id").autoincrement().primaryKey(),
  certificateId: varchar("certificateId", { length: 32 }).notNull().unique(), // Unique public ID for verification
  studentName: varchar("studentName", { length: 100 }).notNull(),
  achievementType: varchar("achievementType", { length: 50 }).notNull(),
  teacherName: varchar("teacherName", { length: 100 }),
  schoolName: varchar("schoolName", { length: 200 }),
  customMessage: text("customMessage"),
  signature: varchar("signature", { length: 128 }).notNull(), // Cryptographic signature
  issuedBy: int("issuedBy").notNull(), // Teacher ID
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"), // Null if valid, timestamp if revoked
  verificationCount: int("verificationCount").default(0).notNull(),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  // School branding for verification page
  schoolLogoUrl: text("schoolLogoUrl"), // URL to school logo
  primaryColor: varchar("primaryColor", { length: 20 }), // Hex color like #2E7D32
  secondaryColor: varchar("secondaryColor", { length: 20 }), // Hex color for accents
});

export type IssuedCertificate = typeof issuedCertificates.$inferSelect;
export type InsertIssuedCertificate = typeof issuedCertificates.$inferInsert;

/**
 * ZIP file email history for bulk certificate downloads
 */
export const zipEmailHistory = mysqlTable("zipEmailHistory", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  certificateCount: int("certificateCount").notNull(),
  studentNames: text("studentNames").notNull(), // JSON array of student names
  zipFileName: varchar("zipFileName", { length: 255 }).notNull(),
  zipFileSize: int("zipFileSize").notNull(), // Size in bytes
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ZipEmailHistory = typeof zipEmailHistory.$inferSelect;
export type InsertZipEmailHistory = typeof zipEmailHistory.$inferInsert;


/**
 * Template sharing relationships - tracks which teachers have shared templates with which colleagues
 */
export const templateShares = mysqlTable("templateShares", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  ownerId: int("ownerId").notNull(), // Teacher who owns the template
  sharedWithId: int("sharedWithId").notNull(), // Teacher who received the template
  shareCode: varchar("shareCode", { length: 20 }).notNull().unique(), // Unique code for sharing
  permission: mysqlEnum("permission", ["view", "edit", "admin"]).default("view").notNull(),
  sharedAt: timestamp("sharedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TemplateRating = typeof templateRatings.$inferSelect;
export type InsertTemplateRating = typeof templateRatings.$inferInsert;

/**
 * Notifications table for in-app notifications and notification center
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["student", "teacher", "admin"]).notNull(),
  type: mysqlEnum("type", [
    "challenge_completed",
    "achievement_earned",
    "task_assigned",
    "task_due_soon",
    "feedback_posted",
    "level_up",
    "streak_milestone",
    "student_completed_task",
    "student_needs_help",
    "new_student_joined",
    "account_change",
    "system_alert",
  ]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body").notNull(),
  linkUrl: varchar("linkUrl", { length: 500 }),
  metadata: json("metadata"), // Store additional context as JSON
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"), // Null if unread
  dismissedAt: timestamp("dismissedAt"), // Optional: for dismissed notifications
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// User notification preferences removed - MathFuel Phase 1 is admin-only notifications
// Students do not receive notifications to preserve flow and encouragement

/**
 * Shared template library - public templates that teachers can discover and import
 */
export const sharedTemplateLibrary = mysqlTable("sharedTemplateLibrary", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general").notNull(),
  tags: varchar("tags", { length: 255 }), // Comma-separated tags
  isPublic: boolean("isPublic").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  rating: int("rating").default(0), // Rating as integer 0-5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SharedTemplateLibrary = typeof sharedTemplateLibrary.$inferSelect;
export type InsertSharedTemplateLibrary = typeof sharedTemplateLibrary.$inferInsert;

/**
 * Template imports - tracks when teachers import shared templates
 */
export const templateImports = mysqlTable("templateImports", {
  id: int("id").autoincrement().primaryKey(),
  originalTemplateId: int("originalTemplateId").notNull(),
  importedByTeacherId: int("importedByTeacherId").notNull(),
  newTemplateId: int("newTemplateId"), // The new template created from the import
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateImport = typeof templateImports.$inferSelect;
export type InsertTemplateImport = typeof templateImports.$inferInsert;


/**
 * Chat conversations - stores teacher conversations with the AI chatbot
 */
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  mode: mysqlEnum("mode", ["general", "ideas", "resources", "trivia", "challenges"]).default("general").notNull(),
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

/**
 * Chat messages - individual messages within conversations
 */
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  mode: mysqlEnum("mode", ["general", "ideas", "resources", "trivia", "challenges"]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;


/**
 * Nutrition Roulette Game - Game Sessions
 * Represents an active or completed game session
 */
export const rouletteGameSessions = mysqlTable("rouletteGameSessions", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  sessionCode: varchar("sessionCode", { length: 10 }).notNull().unique(),
  gameStatus: mysqlEnum("gameStatus", ["waiting", "active", "paused", "completed"]).default("waiting").notNull(),
  currentRound: int("currentRound").default(0).notNull(),
  totalRounds: int("totalRounds").default(5).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  endedAt: timestamp("endedAt"),
});

export type RouletteGameSession = typeof rouletteGameSessions.$inferSelect;
export type InsertRouletteGameSession = typeof rouletteGameSessions.$inferInsert;

/**
 * Nutrition Roulette Game - Player Participation
 * Tracks which players are in which game session
 */
export const rouletteGamePlayers = mysqlTable("rouletteGamePlayers", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId"),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  totalScore: int("totalScore").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  totalAnswers: int("totalAnswers").default(0).notNull(),
  streak: int("streak").default(0).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type RouletteGamePlayer = typeof rouletteGamePlayers.$inferSelect;
export type InsertRouletteGamePlayer = typeof rouletteGamePlayers.$inferInsert;

/**
 * Nutrition Roulette Game - Challenge Types
 * Defines the types of challenges that can appear on the roulette wheel
 */
export const rouletteChallengeTypes = mysqlTable("rouletteChallengeTypes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  color: varchar("color", { length: 20 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RouletteChallengeType = typeof rouletteChallengeTypes.$inferSelect;
export type InsertRouletteChallengeType = typeof rouletteChallengeTypes.$inferInsert;

/**
 * Nutrition Roulette Game - Challenges
 * Individual challenges that appear in the game
 */
export const rouletteChallenges = mysqlTable("rouletteChallenges", {
  id: int("id").autoincrement().primaryKey(),
  typeId: int("typeId").notNull(),
  teacherId: int("teacherId"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  correctAnswer: text("correctAnswer"),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  pointsReward: int("pointsReward").default(100).notNull(),
  timeLimit: int("timeLimit").default(30).notNull(),
  isCustom: boolean("isCustom").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RouletteChallenge = typeof rouletteChallenges.$inferSelect;
export type InsertRouletteChallenge = typeof rouletteChallenges.$inferInsert;

/**
 * Nutrition Roulette Game - Round Results
 * Tracks results for each round in a game session
 */
export const rouletteRoundResults = mysqlTable("rouletteRoundResults", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  roundNumber: int("roundNumber").notNull(),
  challengeId: int("challengeId").notNull(),
  playerId: int("playerId").notNull(),
  playerAnswer: text("playerAnswer"),
  isCorrect: boolean("isCorrect").notNull(),
  pointsEarned: int("pointsEarned").default(0).notNull(),
  timeSpent: int("timeSpent").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RouletteRoundResult = typeof rouletteRoundResults.$inferSelect;
export type InsertRouletteRoundResult = typeof rouletteRoundResults.$inferInsert;

/**
 * Nutrition Roulette Game - Power-ups
 * Special bonuses that can be earned during gameplay
 */
export const roulettePowerUps = mysqlTable("roulettePowerUps", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  effect: varchar("effect", { length: 100 }).notNull(),
  pointsBonus: int("pointsBonus").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoulettePowerUp = typeof roulettePowerUps.$inferSelect;
export type InsertRoulettePowerUp = typeof roulettePowerUps.$inferInsert;

/**
 * Nutrition Roulette Game - Player Power-ups
 * Tracks which power-ups a player has earned
 */
export const roulettePlayerPowerUps = mysqlTable("roulettePlayerPowerUps", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  powerUpId: int("powerUpId").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RoulettePlayerPowerUp = typeof roulettePlayerPowerUps.$inferSelect;
export type InsertRoulettePlayerPowerUp = typeof roulettePlayerPowerUps.$inferInsert;

/**
 * Game Analytics - Student Performance Summary
 * Aggregated performance data for each student across all games
 */
export const gameAnalyticsStudentSummary = mysqlTable("gameAnalyticsStudentSummary", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  totalGamesPlayed: int("totalGamesPlayed").default(1).notNull(),
  totalScore: int("totalScore").default(0).notNull(),
  averageScore: int("averageScore").default(0).notNull(),
  totalCorrectAnswers: int("totalCorrectAnswers").default(0).notNull(),
  totalAnswers: int("totalAnswers").default(0).notNull(),
  accuracyRate: int("accuracyRate").default(0).notNull(), // Percentage 0-100
  bestScore: int("bestScore").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  totalTimeSpent: int("totalTimeSpent").default(0).notNull(), // In seconds
  lastPlayedAt: timestamp("lastPlayedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameAnalyticsStudentSummary = typeof gameAnalyticsStudentSummary.$inferSelect;
export type InsertGameAnalyticsStudentSummary = typeof gameAnalyticsStudentSummary.$inferInsert;

/**
 * Game Analytics - Question Performance
 * Tracks how students perform on specific questions
 */
export const gameAnalyticsQuestionPerformance = mysqlTable("gameAnalyticsQuestionPerformance", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  totalAttempts: int("totalAttempts").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  incorrectAnswers: int("incorrectAnswers").default(0).notNull(),
  accuracyRate: int("accuracyRate").default(0).notNull(), // Percentage 0-100
  averageTimeSpent: int("averageTimeSpent").default(0).notNull(), // In seconds
  averagePointsEarned: int("averagePointsEarned").default(0).notNull(),
  lastAskedAt: timestamp("lastAskedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameAnalyticsQuestionPerformance = typeof gameAnalyticsQuestionPerformance.$inferSelect;
export type InsertGameAnalyticsQuestionPerformance = typeof gameAnalyticsQuestionPerformance.$inferInsert;

/**
 * Game Analytics - Class Performance
 * Aggregated performance data for entire classes
 */
export const gameAnalyticsClassPerformance = mysqlTable("gameAnalyticsClassPerformance", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  className: varchar("className", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  totalStudents: int("totalStudents").default(0).notNull(),
  totalGamesPlayed: int("totalGamesPlayed").default(0).notNull(),
  averageScore: int("averageScore").default(0).notNull(),
  classAccuracyRate: int("classAccuracyRate").default(0).notNull(), // Percentage 0-100
  highestScore: int("highestScore").default(0).notNull(),
  lowestScore: int("lowestScore").default(0).notNull(),
  averageTimePerGame: int("averageTimePerGame").default(0).notNull(), // In seconds
  participationRate: int("participationRate").default(0).notNull(), // Percentage 0-100
  lastGamePlayedAt: timestamp("lastGamePlayedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameAnalyticsClassPerformance = typeof gameAnalyticsClassPerformance.$inferSelect;
export type InsertGameAnalyticsClassPerformance = typeof gameAnalyticsClassPerformance.$inferInsert;

/**
 * Game Analytics - Daily Engagement
 * Tracks daily engagement metrics for trend analysis
 */
export const gameAnalyticsDailyEngagement = mysqlTable("gameAnalyticsDailyEngagement", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  gamesPlayedCount: int("gamesPlayedCount").default(0).notNull(),
  uniquePlayersCount: int("uniquePlayersCount").default(0).notNull(),
  totalPointsEarned: int("totalPointsEarned").default(0).notNull(),
  averageAccuracy: int("averageAccuracy").default(0).notNull(), // Percentage 0-100
  totalTimeSpent: int("totalTimeSpent").default(0).notNull(), // In seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameAnalyticsDailyEngagement = typeof gameAnalyticsDailyEngagement.$inferSelect;
export type InsertGameAnalyticsDailyEngagement = typeof gameAnalyticsDailyEngagement.$inferInsert;

/**
 * Game Analytics - Topic Mastery
 * Tracks student mastery of different nutrition topics
 */
export const gameAnalyticsTopicMastery = mysqlTable("gameAnalyticsTopicMastery", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  topic: varchar("topic", { length: 100 }).notNull(), // e.g., "Vegetables", "Proteins", "Dairy"
  totalQuestionsAsked: int("totalQuestionsAsked").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  masteryPercentage: int("masteryPercentage").default(0).notNull(), // 0-100
  lastPracticedAt: timestamp("lastPracticedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameAnalyticsTopicMastery = typeof gameAnalyticsTopicMastery.$inferSelect;
export type InsertGameAnalyticsTopicMastery = typeof gameAnalyticsTopicMastery.$inferInsert;

/**
 * Game Analytics - Difficulty Progression
 * Tracks how students progress through difficulty levels
 */
export const gameAnalyticsDifficultyProgression = mysqlTable("gameAnalyticsDifficultyProgression", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).notNull(),
  totalAttempts: int("totalAttempts").default(0).notNull(),
  correctAnswers: int("correctAnswers").default(0).notNull(),
  accuracyRate: int("accuracyRate").default(0).notNull(), // 0-100
  averageScore: int("averageScore").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GameAnalyticsDifficultyProgression = typeof gameAnalyticsDifficultyProgression.$inferSelect;
export type InsertGameAnalyticsDifficultyProgression = typeof gameAnalyticsDifficultyProgression.$inferInsert;


/**
 * Game Analytics - Historical Performance Snapshots
 * Stores periodic snapshots of student performance for trend analysis
 */
export const gameAnalyticsHistoricalSnapshots = mysqlTable("gameAnalyticsHistoricalSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  snapshotDate: timestamp("snapshotDate").notNull(), // Date of snapshot
  totalGamesPlayed: int("totalGamesPlayed").default(0).notNull(),
  accuracyRate: int("accuracyRate").default(0).notNull(), // 0-100
  averageScore: int("averageScore").default(0).notNull(),
  totalCorrectAnswers: int("totalCorrectAnswers").default(0).notNull(),
  totalAnswers: int("totalAnswers").default(0).notNull(),
  streakCount: int("streakCount").default(0).notNull(),
  averageTimePerGame: int("averageTimePerGame").default(0).notNull(), // In seconds
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameAnalyticsHistoricalSnapshot = typeof gameAnalyticsHistoricalSnapshots.$inferSelect;
export type InsertGameAnalyticsHistoricalSnapshot = typeof gameAnalyticsHistoricalSnapshots.$inferInsert;

/**
 * Game Analytics - Student Improvement Metrics
 * Tracks improvement metrics and trends for individual students
 */
export const gameAnalyticsStudentImprovement = mysqlTable("gameAnalyticsStudentImprovement", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // "week", "month", "semester"
  accuracyChange: int("accuracyChange").default(0), // Percentage change (can be negative)
  scoreChange: int("scoreChange").default(0), // Absolute score change
  gamesPlayedChange: int("gamesPlayedChange").default(0), // Change in games played
  improvementTrend: mysqlEnum("improvementTrend", ["improving", "stable", "declining"]).default("stable").notNull(),
  improvementPercentage: int("improvementPercentage").default(0).notNull(), // 0-100
  previousAccuracy: int("previousAccuracy").default(0).notNull(),
  currentAccuracy: int("currentAccuracy").default(0).notNull(),
  previousScore: int("previousScore").default(0).notNull(),
  currentScore: int("currentScore").default(0).notNull(),
  periodStartDate: timestamp("periodStartDate").notNull(),
  periodEndDate: timestamp("periodEndDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GameAnalyticsStudentImprovement = typeof gameAnalyticsStudentImprovement.$inferSelect;
export type InsertGameAnalyticsStudentImprovement = typeof gameAnalyticsStudentImprovement.$inferInsert;

/**
 * Game Analytics - Class Improvement Metrics
 * Tracks improvement metrics for entire classes
 */
export const gameAnalyticsClassImprovement = mysqlTable("gameAnalyticsClassImprovement", {
  id: int("id").autoincrement().primaryKey(),
  classId: int("classId").notNull(),
  className: varchar("className", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // "week", "month", "semester"
  classAccuracyChange: int("classAccuracyChange").default(0), // Percentage change
  classScoreChange: int("classScoreChange").default(0), // Absolute change
  participationChange: int("participationChange").default(0), // Percentage change
  improvingStudentCount: int("improvingStudentCount").default(0).notNull(),
  stableStudentCount: int("stableStudentCount").default(0).notNull(),
  decliningStudentCount: int("decliningStudentCount").default(0).notNull(),
  previousClassAccuracy: int("previousClassAccuracy").default(0).notNull(),
  currentClassAccuracy: int("currentClassAccuracy").default(0).notNull(),
  previousAverageScore: int("previousAverageScore").default(0).notNull(),
  currentAverageScore: int("currentAverageScore").default(0).notNull(),
  periodStartDate: timestamp("periodStartDate").notNull(),
  periodEndDate: timestamp("periodEndDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type GameAnalyticsClassImprovement = typeof gameAnalyticsClassImprovement.$inferSelect;
export type InsertGameAnalyticsClassImprovement = typeof gameAnalyticsClassImprovement.$inferInsert;

/**
 * Game Analytics - Student Ranking History
 * Tracks student ranking changes over time
 */
export const gameAnalyticsRankingHistory = mysqlTable("gameAnalyticsRankingHistory", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  classId: int("classId").notNull(),
  teacherId: int("teacherId").notNull(),
  recordDate: timestamp("recordDate").notNull(),
  currentRank: int("currentRank").notNull(),
  previousRank: int("previousRank"),
  rankChange: int("rankChange").default(0), // Positive = improved, negative = declined
  totalScore: int("totalScore").notNull(),
  accuracyRate: int("accuracyRate").notNull(),
  gamesPlayed: int("gamesPlayed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameAnalyticsRankingHistory = typeof gameAnalyticsRankingHistory.$inferSelect;
export type InsertGameAnalyticsRankingHistory = typeof gameAnalyticsRankingHistory.$inferInsert;

/**
 * Game Analytics - Performance Milestones
 * Tracks significant achievements and milestones for students
 */
export const gameAnalyticsPerformanceMilestones = mysqlTable("gameAnalyticsPerformanceMilestones", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  milestoneType: mysqlEnum("milestoneType", [
    "first_game",
    "accuracy_90",
    "accuracy_95",
    "accuracy_100",
    "games_10",
    "games_25",
    "games_50",
    "games_100",
    "streak_5",
    "streak_10",
    "streak_20",
    "top_performer",
    "most_improved",
    "consistent_performer",
  ]).notNull(),
  milestoneDescription: varchar("milestoneDescription", { length: 200 }).notNull(),
  achievedDate: timestamp("achievedDate").defaultNow().notNull(),
  rewardPoints: int("rewardPoints").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GameAnalyticsPerformanceMilestone = typeof gameAnalyticsPerformanceMilestones.$inferSelect;
export type InsertGameAnalyticsPerformanceMilestone = typeof gameAnalyticsPerformanceMilestones.$inferInsert;


/**
 * Student Performance Goals
 * Tracks goals set by teachers for students to achieve
 */
export const studentPerformanceGoals = mysqlTable("studentPerformanceGoals", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  classId: int("classId").notNull(),
  goalType: mysqlEnum("goalType", [
    "accuracy",
    "score",
    "games_played",
    "streak",
    "topic_mastery",
  ]).notNull(),
  goalName: varchar("goalName", { length: 200 }).notNull(),
  goalDescription: text("goalDescription"),
  targetValue: int("targetValue").notNull(), // Target accuracy %, score, games, etc.
  currentValue: int("currentValue").default(0).notNull(), // Current progress
  startDate: timestamp("startDate").notNull(),
  dueDate: timestamp("dueDate").notNull(),
  status: mysqlEnum("status", ["active", "completed", "failed", "paused"]).default("active").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  progressPercentage: int("progressPercentage").default(0).notNull(),
  completedDate: timestamp("completedDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StudentPerformanceGoal = typeof studentPerformanceGoals.$inferSelect;
export type InsertStudentPerformanceGoal = typeof studentPerformanceGoals.$inferInsert;

/**
 * Goal Progress History
 * Tracks progress updates for each goal over time
 */
export const goalProgressHistory = mysqlTable("goalProgressHistory", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  playerId: int("playerId").notNull(),
  previousValue: int("previousValue").notNull(),
  currentValue: int("currentValue").notNull(),
  progressPercentage: int("progressPercentage").notNull(),
  updateReason: varchar("updateReason", { length: 200 }), // e.g., "Game played", "Accuracy improved"
  recordedDate: timestamp("recordedDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GoalProgressHistory = typeof goalProgressHistory.$inferSelect;
export type InsertGoalProgressHistory = typeof goalProgressHistory.$inferInsert;

/**
 * Goal Achievements
 * Records when students achieve their goals
 */
export const goalAchievements = mysqlTable("goalAchievements", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  teacherId: int("teacherId").notNull(),
  goalName: varchar("goalName", { length: 200 }).notNull(),
  achievedDate: timestamp("achievedDate").notNull(),
  daysToComplete: int("daysToComplete"), // How many days it took to complete
  rewardPoints: int("rewardPoints").default(10).notNull(),
  celebrationMessage: text("celebrationMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GoalAchievement = typeof goalAchievements.$inferSelect;
export type InsertGoalAchievement = typeof goalAchievements.$inferInsert;

/**
 * Goal Feedback
 * Teachers can provide feedback on student progress toward goals
 */
export const goalFeedback = mysqlTable("goalFeedback", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  playerId: int("playerId").notNull(),
  teacherId: int("teacherId").notNull(),
  feedbackText: text("feedbackText").notNull(),
  feedbackType: mysqlEnum("feedbackType", ["encouragement", "suggestion", "warning", "celebration"]).default("encouragement").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type GoalFeedback = typeof goalFeedback.$inferSelect;
export type InsertGoalFeedback = typeof goalFeedback.$inferInsert;


/**
 * Student Journal Entries
 * Students write reflections on their goal progress and learning strategies
 */
export const journalEntries = mysqlTable("journalEntries", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  goalId: int("goalId"),
  entryDate: timestamp("entryDate").defaultNow().notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  mood: mysqlEnum("mood", ["excellent", "good", "neutral", "struggling", "discouraged"]).default("neutral").notNull(),
  challengesFaced: text("challengesFaced"),
  strategiesUsed: text("strategiesUsed"),
  lessonsLearned: text("lessonsLearned"),
  nextSteps: text("nextSteps"),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = typeof journalEntries.$inferInsert;

/**
 * Reflection Prompts
 * Pre-defined prompts to guide student reflection
 */
export const reflectionPrompts = mysqlTable("reflectionPrompts", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", ["goal_progress", "challenges", "strategies", "learning", "motivation"]).default("goal_progress").notNull(),
  prompt: text("prompt").notNull(),
  description: text("description"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ReflectionPrompt = typeof reflectionPrompts.$inferSelect;
export type InsertReflectionPrompt = typeof reflectionPrompts.$inferInsert;

/**
 * Journal Insights
 * AI-generated insights from student journal entries
 */
export const journalInsights = mysqlTable("journalInsights", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  insightType: mysqlEnum("insightType", ["progress_trend", "challenge_pattern", "strategy_effectiveness", "motivation_level", "learning_style"]).default("progress_trend").notNull(),
  insight: text("insight").notNull(),
  supportingData: text("supportingData"),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type JournalInsight = typeof journalInsights.$inferSelect;
export type InsertJournalInsight = typeof journalInsights.$inferInsert;

/**
 * Journal Reflections Summary
 * Aggregated reflection data for quick overview
 */
export const journalReflectionsSummary = mysqlTable("journalReflectionsSummary", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  playerName: varchar("playerName", { length: 100 }).notNull(),
  totalEntries: int("totalEntries").default(0).notNull(),
  averageMood: varchar("averageMood", { length: 20 }).default("neutral"),
  mostCommonChallenge: text("mostCommonChallenge"),
  mostEffectiveStrategy: text("mostEffectiveStrategy"),
  lastEntryDate: timestamp("lastEntryDate"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
});
export type JournalReflectionsSummary = typeof journalReflectionsSummary.$inferSelect;
export type InsertJournalReflectionsSummary = typeof journalReflectionsSummary.$inferInsert;


/**
 * Goal Deadline Alerts
 * Tracks reminder preferences and alert history for goal deadlines
 */
export const goalDeadlineAlerts = mysqlTable("goalDeadlineAlerts", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  goalId: int("goalId").notNull(),
  reminderDaysBefore: int("reminderDaysBefore").default(3).notNull(), // Days before deadline to send alert
  alertStatus: mysqlEnum("alertStatus", ["pending", "sent", "dismissed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  dismissedAt: timestamp("dismissedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoalDeadlineAlert = typeof goalDeadlineAlerts.$inferSelect;
export type InsertGoalDeadlineAlert = typeof goalDeadlineAlerts.$inferInsert;

/**
 * Alert Preferences
 * User preferences for deadline reminder notifications
 */
export const alertPreferences = mysqlTable("alertPreferences", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull().unique(),
  enableDeadlineAlerts: boolean("enableDeadlineAlerts").default(true).notNull(),
  defaultReminderDays: int("defaultReminderDays").default(3).notNull(), // Default days before deadline
  alertFrequency: mysqlEnum("alertFrequency", ["immediate", "daily", "weekly"]).default("immediate").notNull(),
  preferredAlertTime: varchar("preferredAlertTime", { length: 5 }).default("09:00"), // HH:MM format
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertPreferences = typeof alertPreferences.$inferSelect;
export type InsertAlertPreferences = typeof alertPreferences.$inferInsert;

/**
 * Alert History
 * Complete history of all alerts sent to students
 */
export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").autoincrement().primaryKey(),
  playerId: int("playerId").notNull(),
  goalId: int("goalId").notNull(),
  goalName: varchar("goalName", { length: 255 }).notNull(),
  daysUntilDeadline: int("daysUntilDeadline").notNull(),
  emailSent: boolean("emailSent").default(false).notNull(),
  emailAddress: varchar("emailAddress", { length: 320 }),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "bounced", "failed", "opened"]).default("sent").notNull(),
  errorMessage: text("errorMessage"),
});

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;


/**
 * Success Stories
 * Showcase students who achieved their goals
 */
export const successStories = mysqlTable("successStories", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  studentName: varchar("studentName", { length: 255 }).notNull(),
  goalId: int("goalId").notNull(),
  goalName: varchar("goalName", { length: 255 }).notNull(),
  goalType: mysqlEnum("goalType", ["accuracy", "score", "games_played", "streak", "topic_mastery"]).notNull(),
  targetValue: int("targetValue").notNull(),
  achievedValue: int("achievedValue").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  testimonial: text("testimonial"),
  tips: text("tips"), // JSON array of tips
  imageUrl: varchar("imageUrl", { length: 500 }),
  impactScore: int("impactScore").default(0), // 0-100 based on difficulty and improvement
  receivedAlerts: boolean("receivedAlerts").default(false).notNull(),
  alertsCount: int("alertsCount").default(0),
  daysToAchieve: int("daysToAchieve"),
  isPublished: boolean("isPublished").default(false).notNull(),
  isFeature: boolean("isFeature").default(false).notNull(), // Featured story
  classId: int("classId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  achievedAt: timestamp("achievedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SuccessStory = typeof successStories.$inferSelect;
export type InsertSuccessStory = typeof successStories.$inferInsert;

/**
 * Success Story Reactions
 * Track likes and reactions from other students
 */
export const successStoryReactions = mysqlTable("successStoryReactions", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId").notNull(),
  studentId: int("studentId").notNull(),
  reactionType: mysqlEnum("reactionType", ["like", "inspired", "helpful", "motivating"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SuccessStoryReaction = typeof successStoryReactions.$inferSelect;
export type InsertSuccessStoryReaction = typeof successStoryReactions.$inferInsert;

/**
 * Success Story Comments
 * Allow students to comment on success stories
 */
export const successStoryComments = mysqlTable("successStoryComments", {
  id: int("id").autoincrement().primaryKey(),
  storyId: int("storyId").notNull(),
  studentId: int("studentId").notNull(),
  studentName: varchar("studentName", { length: 255 }).notNull(),
  comment: text("comment").notNull(),
  isApproved: boolean("isApproved").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SuccessStoryComment = typeof successStoryComments.$inferSelect;
export type InsertSuccessStoryComment = typeof successStoryComments.$inferInsert;


/**
 * Export history for PDF reports
 */
export const exportHistory = mysqlTable("exportHistory", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  classId: int("classId").notNull(),
  exportType: varchar("exportType", { length: 50 }).notNull().default("success_stories"),
  storyCount: int("storyCount").notNull(),
  dateRange: json("dateRange"),
  options: json("options"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;


/**
 * Trial requests from schools requesting free access
 */
export const trialRequests = mysqlTable("trialRequests", {
  id: int("id").autoincrement().primaryKey(),
  schoolName: varchar("schoolName", { length: 255 }).notNull(),
  district: varchar("district", { length: 255 }),
  state: varchar("state", { length: 2 }).notNull(),
  contactName: varchar("contactName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 20 }),
  role: mysqlEnum("role", ["principal", "teacher", "nutrition_coordinator", "it_director", "superintendent", "other"]).notNull(),
  studentCount: int("studentCount"),
  teacherCount: int("teacherCount"),
  message: text("message"),
  status: mysqlEnum("status", ["pending", "approved", "trial_created", "completed", "rejected"]).default("pending").notNull(),
  trialAccountId: int("trialAccountId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrialRequest = typeof trialRequests.$inferSelect;
export type InsertTrialRequest = typeof trialRequests.$inferInsert;

/**
 * Trial accounts created for schools
 */
export const trialAccounts = mysqlTable("trialAccounts", {
  id: int("id").autoincrement().primaryKey(),
  trialRequestId: int("trialRequestId").notNull(),
  schoolCode: varchar("schoolCode", { length: 20 }).notNull().unique(),
  adminUserId: int("adminUserId"),
  adminEmail: varchar("adminEmail", { length: 320 }).notNull(),
  adminPassword: varchar("adminPassword", { length: 255 }).notNull(),
  trialStartDate: timestamp("trialStartDate").defaultNow().notNull(),
  trialEndDate: timestamp("trialEndDate").notNull(),
  trialDays: int("trialDays").default(30).notNull(),
  status: mysqlEnum("status", ["active", "expired", "converted", "cancelled"]).default("active").notNull(),
  classesCreated: int("classesCreated").default(0).notNull(),
  studentsAdded: int("studentsAdded").default(0).notNull(),
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  certificatesGenerated: int("certificatesGenerated").default(0).notNull(),
  lastActivityAt: timestamp("lastActivityAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrialAccount = typeof trialAccounts.$inferSelect;
export type InsertTrialAccount = typeof trialAccounts.$inferInsert;

/**
 * Trial metrics and engagement tracking
 */
export const trialMetrics = mysqlTable("trialMetrics", {
  id: int("id").autoincrement().primaryKey(),
  trialAccountId: int("trialAccountId").notNull(),
  date: date("date").notNull(),
  activeUsers: int("activeUsers").default(0).notNull(),
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  certificatesGenerated: int("certificatesGenerated").default(0).notNull(),
  emailsSent: int("emailsSent").default(0).notNull(),
  pdfExportsGenerated: int("pdfExportsGenerated").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrialMetric = typeof trialMetrics.$inferSelect;
export type InsertTrialMetric = typeof trialMetrics.$inferInsert;

/**
 * Trial follow-up emails sent to schools
 */
export const trialFollowUps = mysqlTable("trialFollowUps", {
  id: int("id").autoincrement().primaryKey(),
  trialAccountId: int("trialAccountId").notNull(),
  emailType: mysqlEnum("emailType", ["welcome", "day_3_check_in", "day_7_engagement", "day_14_features", "day_28_conversion", "expired_offer"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  opened: boolean("opened").default(false).notNull(),
  clicked: boolean("clicked").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrialFollowUp = typeof trialFollowUps.$inferSelect;
export type InsertTrialFollowUp = typeof trialFollowUps.$inferInsert;

/**
 * User Feedback Collection Tables
 */


/**
 * User Feedback Collection Tables
 */
export const userFeedback = mysqlTable("user_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  trialAccountId: int("trial_account_id"),
  feedbackType: mysqlEnum("feedback_type", ["bug", "feature_request", "usability", "performance", "other"]).notNull(),
  category: mysqlEnum("category", ["game", "certificates", "analytics", "ui", "mobile", "other"]).notNull(),
  rating: int("rating"), // 1-5 scale
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description").notNull(),
  attachmentUrl: text("attachment_url"), // URL to screenshot or file
  status: mysqlEnum("status", ["new", "reviewed", "in_progress", "resolved", "wont_fix"]).default("new").notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

export const feedbackResponses = mysqlTable("feedback_responses", {
  id: int("id").autoincrement().primaryKey(),
  feedbackId: int("feedback_id").notNull(),
  adminId: int("admin_id"),
  responseText: text("response_text").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FeedbackResponse = typeof feedbackResponses.$inferSelect;
export type InsertFeedbackResponse = typeof feedbackResponses.$inferInsert;

export const feedbackAnalytics = mysqlTable("feedback_analytics", {
  id: int("id").autoincrement().primaryKey(),
  date: date("date").notNull(),
  totalFeedback: int("total_feedback").default(0).notNull(),
  bugReports: int("bug_reports").default(0).notNull(),
  featureRequests: int("feature_requests").default(0).notNull(),
  usabilityIssues: int("usability_issues").default(0).notNull(),
  averageRating: int("average_rating"), // Stored as integer * 100 for precision
  topCategories: json("top_categories"), // JSON array of category counts
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type FeedbackAnalytics = typeof feedbackAnalytics.$inferSelect;
export type InsertFeedbackAnalytics = typeof feedbackAnalytics.$inferInsert;


/**
 * Admin notification preferences for customizing alerts
 */
export const adminNotificationPreferences = mysqlTable("adminNotificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  // Frequency settings
  frequency: mysqlEnum("frequency", ["immediate", "daily", "weekly"]).default("immediate").notNull(),
  // Channel preferences
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  dashboardEnabled: boolean("dashboardEnabled").default(true).notNull(),
  // Notification type filters
  feedbackEnabled: boolean("feedbackEnabled").default(true).notNull(),
  lowRatingsEnabled: boolean("lowRatingsEnabled").default(true).notNull(),
  bugsEnabled: boolean("bugsEnabled").default(true).notNull(),
  trialEventsEnabled: boolean("trialEventsEnabled").default(true).notNull(),
  paymentEventsEnabled: boolean("paymentEventsEnabled").default(false).notNull(),
  // Daily digest time (for daily/weekly frequency)
  digestTime: varchar("digestTime", { length: 5 }), // Format: "HH:MM" (24-hour)
  // Quiet hours (no notifications during this time)
  quietHoursStart: varchar("quietHoursStart", { length: 5 }), // Format: "HH:MM"
  quietHoursEnd: varchar("quietHoursEnd", { length: 5 }), // Format: "HH:MM"
  quietHoursEnabled: boolean("quietHoursEnabled").default(false).notNull(),
  // Test notification sent
  lastTestSentAt: timestamp("lastTestSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminNotificationPreferences = typeof adminNotificationPreferences.$inferSelect;
export type InsertAdminNotificationPreferences = typeof adminNotificationPreferences.$inferInsert;

/**
 * Notification history/inbox for admins
 */
export const notificationHistory = mysqlTable("notificationHistory", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  type: mysqlEnum("type", ["feedback", "trial", "payment", "system"]).notNull(),
  subType: varchar("subType", { length: 50 }), // e.g., "low_rating", "bug_report", "trial_expiring"
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  relatedEntityId: int("relatedEntityId"), // ID of feedback, trial, etc.
  relatedEntityType: varchar("relatedEntityType", { length: 50 }), // "feedback", "trial", "payment"
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: varchar("actionUrl", { length: 500 }), // Link to take action
  emailSent: boolean("emailSent").default(false).notNull(),
  inAppShown: boolean("inAppShown").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NotificationHistory = typeof notificationHistory.$inferSelect;
export type InsertNotificationHistory = typeof notificationHistory.$inferInsert;


/**
 * Parent accounts - allows parents to track their children's progress
 */
export const parentAccounts = mysqlTable("parentAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  preferredLanguage: varchar("preferredLanguage", { length: 10 }).default("en").notNull(),
  notificationPreference: mysqlEnum("notificationPreference", ["email", "sms", "both", "none"]).default("email").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParentAccount = typeof parentAccounts.$inferSelect;
export type InsertParentAccount = typeof parentAccounts.$inferInsert;

/**
 * Student-parent relationships
 */
export const studentParentLinks = mysqlTable("studentParentLinks", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  parentId: int("parentId").notNull(),
  relationship: varchar("relationship", { length: 50 }).notNull(), // "mother", "father", "guardian", "tutor"
  accessLevel: mysqlEnum("accessLevel", ["view_only", "view_and_comment", "full_access"]).default("view_only").notNull(),
  linkedAt: timestamp("linkedAt").defaultNow().notNull(),
});

export type StudentParentLink = typeof studentParentLinks.$inferSelect;
export type InsertStudentParentLink = typeof studentParentLinks.$inferInsert;

/**
 * Home practice assignments assigned by teachers to students
 */
export const homePracticeAssignments = mysqlTable("homePracticeAssignments", {
  id: int("id").autoincrement().primaryKey(),
  teacherId: int("teacherId").notNull(),
  studentId: int("studentId").notNull(),
  classId: int("classId"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // "arithmetic", "algebra", "geometry", etc.
  problemCount: int("problemCount").notNull().default(5),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard", "adaptive"]).default("adaptive").notNull(),
  dueDate: timestamp("dueDate"),
  assignedDate: timestamp("assignedDate").defaultNow().notNull(),
  status: mysqlEnum("status", ["active", "completed", "overdue", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HomePracticeAssignment = typeof homePracticeAssignments.$inferSelect;
export type InsertHomePracticeAssignment = typeof homePracticeAssignments.$inferInsert;

/**
 * Student progress on home practice assignments
 */
export const homePracticeProgress = mysqlTable("homePracticeProgress", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  studentId: int("studentId").notNull(),
  problemsAttempted: int("problemsAttempted").notNull().default(0),
  problemsCorrect: int("problemsCorrect").notNull().default(0),
  accuracyPercentage: int("accuracyPercentage").notNull().default(0),
  timeSpentMinutes: int("timeSpentMinutes").notNull().default(0),
  completionPercentage: int("completionPercentage").notNull().default(0),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  lastAttemptAt: timestamp("lastAttemptAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HomePracticeProgress = typeof homePracticeProgress.$inferSelect;
export type InsertHomePracticeProgress = typeof homePracticeProgress.$inferInsert;

/**
 * Student achievements and milestones
 */
export const studentAchievements = mysqlTable("studentAchievements", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  achievementType: varchar("achievementType", { length: 100 }).notNull(), // "perfect_score", "streak_7_days", "mastered_algebra", etc.
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  badgeIcon: varchar("badgeIcon", { length: 500 }), // URL to badge image
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  notifiedAt: timestamp("notifiedAt"),
});

export type StudentAchievement = typeof studentAchievements.$inferSelect;
export type InsertStudentAchievement = typeof studentAchievements.$inferInsert;

/**
 * Parent-teacher messages and communication
 */
export const parentTeacherMessages = mysqlTable("parentTeacherMessages", {
  id: int("id").autoincrement().primaryKey(),
  senderId: int("senderId").notNull(), // parent or teacher
  recipientId: int("recipientId").notNull(),
  studentId: int("studentId").notNull(), // context of the message
  subject: varchar("subject", { length: 200 }).notNull(),
  message: text("message").notNull(),
  messageType: mysqlEnum("messageType", ["general", "progress_update", "concern", "celebration", "question"]).default("general").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  readAt: timestamp("readAt"),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ParentTeacherMessage = typeof parentTeacherMessages.$inferSelect;
export type InsertParentTeacherMessage = typeof parentTeacherMessages.$inferInsert;

/**
 * Parent-visible progress summaries (weekly/monthly)
 */
export const parentProgressReports = mysqlTable("parentProgressReports", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  parentId: int("parentId").notNull(),
  reportPeriod: mysqlEnum("reportPeriod", ["weekly", "biweekly", "monthly"]).default("weekly").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  totalProblemsAttempted: int("totalProblemsAttempted").notNull().default(0),
  totalProblemsCorrect: int("totalProblemsCorrect").notNull().default(0),
  averageAccuracy: int("averageAccuracy").notNull().default(0),
  topicsMastered: text("topicsMastered"), // JSON array of topics
  topicsNeedingWork: text("topicsNeedingWork"), // JSON array of topics
  recommendedPracticeAreas: text("recommendedPracticeAreas"), // JSON array
  summaryNotes: text("summaryNotes"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  viewedAt: timestamp("viewedAt"),
});

export type ParentProgressReport = typeof parentProgressReports.$inferSelect;
export type InsertParentProgressReport = typeof parentProgressReports.$inferInsert;
