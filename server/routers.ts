import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { adminSettingsRouter } from "./routers/adminSettings";
import { mathContentRouter } from "./routers/mathContent";
import { practiceRouter } from "./routers/practice";
import { studentRouter } from "./routers/student";
import { parentRouter } from "./routers/parent";
import { aiTutorRouter } from "./routers/aiTutor";

export const appRouter = router({
  system: systemRouter,
  adminSettings: adminSettingsRouter,
  mathContent: mathContentRouter,
  practice: practiceRouter,
  student: studentRouter,
  parent: parentRouter,
  aiTutor: aiTutorRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
  }),
});

export type AppRouter = typeof appRouter;
