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
