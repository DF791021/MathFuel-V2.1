import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { ENV } from "../_core/env";
import * as db from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const SALT_ROUNDS = 12;

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
      // Check if email already exists
      const existing = await getUserByEmail(input.email);
      if (existing) {
        throw new Error("An account with this email already exists. Please log in instead.");
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Generate a unique openId for this user
      const openId = `local_${randomUUID()}`;

      // Create user
      await db.upsertUser({
        openId,
        name: input.name,
        email: input.email,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Now update passwordHash, userType, and gradeLevel directly
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

      // Create session
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
      // Find user by email
      const user = await getUserByEmail(input.email);
      if (!user) {
        throw new Error("Invalid email or password.");
      }

      // Check if user has a password (might be OAuth-only user)
      if (!user.passwordHash) {
        throw new Error(
          "This account was created with a different login method. Please contact support."
        );
      }

      // Verify password
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error("Invalid email or password.");
      }

      // Update last signed in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      // Create session
      const token = await createJWT(user.openId, user.name || "");
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, user };
    }),

  // Keep the existing me + logout from the main router
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
