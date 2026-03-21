import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import * as db from "../db";
import { users, passwordResetTokens } from "../../drizzle/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { randomUUID, randomBytes } from "crypto";
import { sendEmail } from "../_core/email";

const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

async function createJWT(openId: string, name: string): Promise<string> {
  const secretKey = getSessionSecret();
  const expiresInMs = ONE_YEAR_MS;
  const expirationSeconds = Math.floor((Date.now() + expiresInMs) / 1000);

  return new SignJWT({
    openId,
    appId: ENV.appId,
    name,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

async function getUserByEmail(email: string) {
  const dbConn = await db.getDb();
  if (!dbConn) return null;
  const result = await dbConn
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

function buildResetEmailHtml(name: string, resetUrl: string): string {
  return `
    <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #3730A3 0%, #1E1B4B 100%); color: white; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800;">🚀 MathFuel</h1>
        <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9;">Password Reset Request</p>
      </div>
      <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
        <p style="font-size: 16px; color: #1e293b; margin: 0 0 16px;">Hi <strong>${name || "there"}</strong>,</p>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your MathFuel password. Click the button below to create a new password. This link expires in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #3730A3; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 700; letter-spacing: 0.3px;">
            Reset My Password
          </a>
        </div>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 24px 0 0;">
          If you didn't request this, you can safely ignore this email. Your password won't change until you click the link above and create a new one.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
          MathFuel — Math practice that actually works
        </p>
      </div>
    </div>
  `;
}

export const customAuthRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email().max(320),
        password: z.string().min(6).max(128),
        name: z.string().min(1).max(200),
        userType: z.enum(["student", "parent", "teacher"]),
        gradeLevel: z.number().int().min(1).max(12).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new Error("An account with this email already exists. Please log in instead.");
      }

      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
      const openId = `local_${randomUUID()}`;

      await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      const dbConn = await db.getDb();
      if (dbConn) {
        const updateSet: Record<string, unknown> = {
          passwordHash,
          userType: input.userType,
        };
        if (input.gradeLevel) {
          updateSet.gradeLevel = input.gradeLevel;
        }
        await dbConn
          .update(users)
          .set(updateSet)
          .where(eq(users.openId, openId));
      }

      const token = await createJWT(openId, input.name);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      const user = await db.getUserByOpenId(openId);
      return { success: true, user };
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new Error("Invalid email or password.");
      }

      if (!user.passwordHash) {
        throw new Error(
          "This account was created with a different login method. Please contact support."
        );
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Invalid email or password.");
      }

      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      const token = await createJWT(user.openId, user.name || "");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, user };
    }),

  // ── Forgot Password ──
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      // Always return success to prevent email enumeration
      const user = await getUserByEmail(input.email);
      if (!user) {
        return { success: true, message: "If an account with that email exists, we've sent a reset link." };
      }

      const dbConn = await db.getDb();
      if (!dbConn) {
        throw new Error("Service temporarily unavailable. Please try again.");
      }

      // Generate token
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

      // Store token
      await dbConn.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Build reset URL
      const origin = ctx.req.headers.origin || ctx.req.headers.referer?.replace(/\/$/, "") || "https://mathfuel.org";
      const resetUrl = `${origin}/reset-password?token=${token}`;

      // Send email
      await sendEmail({
        to: input.email,
        subject: "Reset your MathFuel password",
        html: buildResetEmailHtml(user.name || "", resetUrl),
      });

      console.log(`[Auth] Password reset requested for user ${user.id}`);

      return { success: true, message: "If an account with that email exists, we've sent a reset link." };
    }),

  // ── Verify Reset Token (check if token is valid before showing reset form) ──
  verifyResetToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) return { valid: false };

      const now = new Date();
      const result = await dbConn
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, input.token),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, now)
          )
        )
        .limit(1);

      return { valid: result.length > 0 };
    }),

  // ── Reset Password ──
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string().min(1),
        newPassword: z.string().min(6).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) {
        throw new Error("Service temporarily unavailable. Please try again.");
      }

      const now = new Date();

      // Find valid token
      const tokenResults = await dbConn
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, input.token),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, now)
          )
        )
        .limit(1);

      if (tokenResults.length === 0) {
        throw new Error("This reset link has expired or already been used. Please request a new one.");
      }

      const resetToken = tokenResults[0];

      // Hash new password
      const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

      // Update user's password
      await dbConn
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await dbConn
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, resetToken.id));

      console.log(`[Auth] Password reset completed for user ${resetToken.userId}`);

      return { success: true, message: "Password has been reset. You can now log in with your new password." };
    }),

  me: publicProcedure.query((opts) => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  setUserType: protectedProcedure
    .input(z.object({ userType: z.enum(["student", "parent", "teacher"]) }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserType(ctx.user.id, input.userType);
      return { success: true };
    }),

  setGrade: protectedProcedure
    .input(z.object({ gradeLevel: z.number().int().min(1).max(12) }))
    .mutation(async ({ ctx, input }) => {
      await db.updateUserGrade(ctx.user.id, input.gradeLevel);
      return { success: true };
    }),
});
