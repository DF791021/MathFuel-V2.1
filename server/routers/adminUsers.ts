import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { randomBytes, randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import { passwordResetTokens, users } from "../../drizzle/schema";
import { sendEmail } from "../_core/email";

const INVITE_EXPIRY_MS = 48 * 60 * 60 * 1000;

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Super Admin access required" });
  }
  return next({ ctx });
});

function getInviteUrl(req: any, token: string) {
  const origin = req.headers.origin || (typeof req.headers.referer === "string" ? req.headers.referer.replace(/\/$/, "") : "https://mathfuel.org");
  return `${origin}/reset-password?token=${token}`;
}

function buildInviteEmail(name: string, email: string, url: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1e293b"><div style="background:linear-gradient(135deg,#4f46e5,#3730a3);color:#fff;padding:32px;border-radius:14px 14px 0 0;text-align:center"><h1 style="margin:0">MathFuel</h1><p style="margin:8px 0 0">Your account is ready</p></div><div style="padding:32px;border:1px solid #e2e8f0;border-top:0;border-radius:0 0 14px 14px"><p>Hi <strong>${name || "there"}</strong>,</p><p>A MathFuel administrator created your account. Your username is your assigned email address:</p><p style="padding:12px 16px;background:#f8fafc;border-radius:8px"><strong>${email}</strong></p><p>Use the button below to create your password. This invitation expires in 48 hours and can only be used once.</p><p style="text-align:center;margin:28px 0"><a href="${url}" style="background:#4f46e5;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">Create My Password</a></p><p style="font-size:13px;color:#64748b">After setting your password, sign in with this email address and the password you create.</p></div></div>`;
}

async function createInvite(userId: number, req: any) {
  const connection = await db.getDb();
  if (!connection) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not configured." });
  const token = randomBytes(32).toString("hex");
  await connection.insert(passwordResetTokens).values({ userId, token, purpose: "invite", expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS) });
  return getInviteUrl(req, token);
}

export const adminUsersRouter = router({
  list: adminProcedure.query(async () => {
    const connection = await db.getDb();
    if (!connection) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not configured." });
    return connection.select({ id: users.id, name: users.name, email: users.email, role: users.role, userType: users.userType, gradeLevel: users.gradeLevel, passwordSet: users.passwordHash, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.createdAt));
  }),

  create: adminProcedure.input(z.object({ email: z.string().email().max(320), name: z.string().trim().min(1).max(200), userType: z.enum(["student", "parent", "teacher"]), gradeLevel: z.number().int().min(1).max(12).optional() })).mutation(async ({ ctx, input }) => {
    const connection = await db.getDb();
    if (!connection) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not configured." });
    const email = input.email.trim().toLowerCase();
    const existing = await connection.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
    const inserted = await connection.insert(users).values({ openId: `local_${randomUUID()}`, name: input.name.trim(), email, loginMethod: "email", userType: input.userType, role: "user", gradeLevel: input.gradeLevel, passwordHash: null }).returning({ id: users.id });
    const userId = inserted[0]?.id;
    if (!userId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The account could not be created." });
    const url = await createInvite(userId, ctx.req);
    const sent = await sendEmail({ to: email, subject: "Your MathFuel account is ready", html: buildInviteEmail(input.name, email, url) });
    await db.createAuditLog({ adminId: ctx.user.id, action: "CREATE_USER_INVITE", resourceType: "users", resourceId: String(userId), changes: { email, userType: input.userType, invitationSent: sent } });
    return { success: true, userId, invitationSent: sent };
  }),

  resendInvite: adminProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const connection = await db.getDb();
    if (!connection) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not configured." });
    const result = await connection.select().from(users).where(eq(users.id, input.userId)).limit(1);
    const user = result[0];
    if (!user?.email) throw new TRPCError({ code: "NOT_FOUND", message: "User not found." });
    if (user.passwordHash) throw new TRPCError({ code: "BAD_REQUEST", message: "This user already has a password. Use Forgot Password instead." });
    const url = await createInvite(user.id, ctx.req);
    const sent = await sendEmail({ to: user.email, subject: "Your MathFuel account is ready", html: buildInviteEmail(user.name || "there", user.email, url) });
    await db.createAuditLog({ adminId: ctx.user.id, action: "RESEND_USER_INVITE", resourceType: "users", resourceId: String(user.id), changes: { invitationSent: sent } });
    return { success: true, invitationSent: sent };
  }),
});
