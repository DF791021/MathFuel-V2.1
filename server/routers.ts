import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    setUserType: protectedProcedure
      .input(z.object({ userType: z.enum(["student", "teacher"]) }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserType(ctx.user.id, input.userType);
        return { success: true };
      }),
  }),

  game: router({
    saveScore: publicProcedure
      .input(z.object({
        playerName: z.string().min(1).max(100),
        score: z.number().int().min(0),
        totalQuestions: z.number().int().min(0),
        correctAnswers: z.number().int().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.saveGameScore({
          ...input,
          userId: ctx.user?.id ?? null,
        });
        return { success: true };
      }),
    
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(10) }).optional())
      .query(async ({ input }) => {
        const limit = input?.limit ?? 10;
        return db.getTopScores(limit);
      }),
    
    getMyScores: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserScores(ctx.user.id);
    }),
  }),

  questions: router({
    getAll: publicProcedure.query(async () => {
      return db.getActiveCustomQuestions();
    }),
    
    getMyQuestions: protectedProcedure.query(async ({ ctx }) => {
      return db.getTeacherQuestions(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        category: z.string().min(1).max(50),
        questionType: z.enum(["question", "activity"]),
        question: z.string().min(1),
        answer: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createCustomQuestion({
          ...input,
          answer: input.answer ?? null,
          createdBy: ctx.user.id,
        });
        return { success: true };
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number().int(),
        category: z.string().min(1).max(50).optional(),
        questionType: z.enum(["question", "activity"]).optional(),
        question: z.string().min(1).optional(),
        answer: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCustomQuestion(id, data);
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await db.deleteCustomQuestion(input.id);
        return { success: true };
      }),
  }),

  classes: router({
    create: protectedProcedure
      .input(z.object({ name: z.string().min(1).max(100) }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.createClass({ name: input.name, teacherId: ctx.user.id });
        return result;
      }),
    
    getMyClasses: protectedProcedure.query(async ({ ctx }) => {
      return db.getTeacherClasses(ctx.user.id);
    }),
    
    getMembers: protectedProcedure
      .input(z.object({ classId: z.number().int() }))
      .query(async ({ input }) => {
        return db.getClassMembers(input.classId);
      }),
    
    join: protectedProcedure
      .input(z.object({ joinCode: z.string().length(6) }))
      .mutation(async ({ ctx, input }) => {
        const classData = await db.getClassByJoinCode(input.joinCode.toUpperCase());
        if (!classData) {
          throw new Error("Invalid join code");
        }
        await db.joinClass(classData.id, ctx.user.id);
        return { success: true, className: classData.name };
      }),
    
    getStudentClasses: protectedProcedure.query(async ({ ctx }) => {
      return db.getStudentClasses(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
