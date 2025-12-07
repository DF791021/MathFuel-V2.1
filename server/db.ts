import { eq, desc, and, lt, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, gameScores, InsertGameScore, customQuestions, InsertCustomQuestion, classes, InsertClass, classMembers, InsertClassMember, emailTemplates, InsertEmailTemplate, scheduledEmails, InsertScheduledEmail } from "../drizzle/schema";
import { nanoid } from 'nanoid';
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.userType !== undefined) {
      values.userType = user.userType;
      updateSet.userType = user.userType;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserType(userId: number, userType: "student" | "teacher" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ userType }).where(eq(users.id, userId));
}

// ============ GAME SCORE FUNCTIONS ============

export async function saveGameScore(score: InsertGameScore) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(gameScores).values(score);
  return result;
}

export async function getTopScores(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(gameScores).orderBy(desc(gameScores.score)).limit(limit);
  return result;
}

export async function getUserScores(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(gameScores).where(eq(gameScores.userId, userId)).orderBy(desc(gameScores.playedAt));
  return result;
}

// ============ CUSTOM QUESTIONS FUNCTIONS ============

export async function createCustomQuestion(question: InsertCustomQuestion) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(customQuestions).values(question);
  return result;
}

export async function getActiveCustomQuestions() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(customQuestions).where(eq(customQuestions.isActive, true));
  return result;
}

export async function getTeacherQuestions(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(customQuestions).where(eq(customQuestions.createdBy, teacherId)).orderBy(desc(customQuestions.createdAt));
  return result;
}

export async function updateCustomQuestion(id: number, data: Partial<InsertCustomQuestion>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(customQuestions).set(data).where(eq(customQuestions.id, id));
}

export async function deleteCustomQuestion(id: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(customQuestions).where(eq(customQuestions.id, id));
}

// ============ CLASS FUNCTIONS ============

export async function createClass(data: Omit<InsertClass, 'joinCode'>) {
  const db = await getDb();
  if (!db) return null;
  
  const joinCode = nanoid(6).toUpperCase();
  const result = await db.insert(classes).values({ ...data, joinCode });
  return { joinCode };
}

export async function getTeacherClasses(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(classes).where(eq(classes.teacherId, teacherId));
  return result;
}

export async function getClassByJoinCode(joinCode: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(classes).where(eq(classes.joinCode, joinCode)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function joinClass(classId: number, studentId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const existing = await db.select().from(classMembers).where(and(eq(classMembers.classId, classId), eq(classMembers.studentId, studentId))).limit(1);
  if (existing.length > 0) return existing[0];
  
  await db.insert(classMembers).values({ classId, studentId });
  return { classId, studentId };
}

export async function getClassMembers(classId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      id: classMembers.id,
      studentId: classMembers.studentId,
      joinedAt: classMembers.joinedAt,
      studentName: users.name,
    })
    .from(classMembers)
    .leftJoin(users, eq(classMembers.studentId, users.id))
    .where(eq(classMembers.classId, classId));
  
  return result;
}

export async function getStudentClasses(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      classId: classes.id,
      className: classes.name,
      joinedAt: classMembers.joinedAt,
    })
    .from(classMembers)
    .innerJoin(classes, eq(classMembers.classId, classes.id))
    .where(eq(classMembers.studentId, studentId));
  
  return result;
}

// ============ EMAIL TEMPLATE FUNCTIONS ============

export async function createEmailTemplate(template: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) return null;
  
  // If this is set as default, unset other defaults for same achievement type
  if (template.isDefault && template.achievementType) {
    await db.update(emailTemplates)
      .set({ isDefault: false })
      .where(and(
        eq(emailTemplates.teacherId, template.teacherId),
        eq(emailTemplates.achievementType, template.achievementType)
      ));
  }
  
  const result = await db.insert(emailTemplates).values(template);
  return result;
}

export async function getTeacherEmailTemplates(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(emailTemplates)
    .where(eq(emailTemplates.teacherId, teacherId))
    .orderBy(desc(emailTemplates.createdAt));
  return result;
}

export async function getEmailTemplateById(id: number, teacherId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailTemplates)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.teacherId, teacherId)))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateEmailTemplate(id: number, teacherId: number, data: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) return;
  
  // If setting as default, unset other defaults for same achievement type
  if (data.isDefault && data.achievementType) {
    await db.update(emailTemplates)
      .set({ isDefault: false })
      .where(and(
        eq(emailTemplates.teacherId, teacherId),
        eq(emailTemplates.achievementType, data.achievementType)
      ));
  }
  
  await db.update(emailTemplates)
    .set(data)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.teacherId, teacherId)));
}

export async function deleteEmailTemplate(id: number, teacherId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.delete(emailTemplates)
    .where(and(eq(emailTemplates.id, id), eq(emailTemplates.teacherId, teacherId)));
}

export async function getDefaultTemplate(teacherId: number, achievementType: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(emailTemplates)
    .where(and(
      eq(emailTemplates.teacherId, teacherId),
      eq(emailTemplates.achievementType, achievementType),
      eq(emailTemplates.isDefault, true)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

// ============ SCHEDULED EMAIL FUNCTIONS ============

export async function createScheduledEmail(email: InsertScheduledEmail) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(scheduledEmails).values(email);
  return result;
}

export async function getTeacherScheduledEmails(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(scheduledEmails)
    .where(eq(scheduledEmails.teacherId, teacherId))
    .orderBy(desc(scheduledEmails.scheduledFor));
  return result;
}

export async function getPendingScheduledEmails(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(scheduledEmails)
    .where(and(
      eq(scheduledEmails.teacherId, teacherId),
      eq(scheduledEmails.status, "pending")
    ))
    .orderBy(scheduledEmails.scheduledFor);
  return result;
}

export async function cancelScheduledEmail(id: number, teacherId: number) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(scheduledEmails)
    .set({ status: "cancelled" })
    .where(and(
      eq(scheduledEmails.id, id),
      eq(scheduledEmails.teacherId, teacherId),
      eq(scheduledEmails.status, "pending")
    ));
}

export async function updateScheduledEmail(id: number, teacherId: number, data: Partial<InsertScheduledEmail>) {
  const db = await getDb();
  if (!db) return;
  
  await db.update(scheduledEmails)
    .set(data)
    .where(and(
      eq(scheduledEmails.id, id),
      eq(scheduledEmails.teacherId, teacherId),
      eq(scheduledEmails.status, "pending")
    ));
}

export async function getScheduledEmailById(id: number, teacherId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(scheduledEmails)
    .where(and(
      eq(scheduledEmails.id, id),
      eq(scheduledEmails.teacherId, teacherId)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}
