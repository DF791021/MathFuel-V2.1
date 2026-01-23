import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

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

export type TemplateShare = typeof templateShares.$inferSelect;
export type InsertTemplateShare = typeof templateShares.$inferInsert;

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
