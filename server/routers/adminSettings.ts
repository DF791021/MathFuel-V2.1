import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminSettingsRouter = router({
  getFeatureFlags: adminProcedure.query(async () => {
    return db.getAllFeatureFlags();
  }),

  toggleFeatureFlag: adminProcedure
    .input(z.object({ name: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.setFeatureFlag(input.name, input.enabled, ctx.user.name ?? "admin");
      return { success: true };
    }),

  getSettings: adminProcedure.query(async () => {
    return db.getAllAdminSettings();
  }),

  setSetting: adminProcedure
    .input(z.object({
      key: z.string(),
      value: z.any(),
      type: z.enum(["boolean", "string", "number", "json"]),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.setAdminSetting(input.key, input.value, input.type, input.description ?? "", ctx.user.id);
      return { success: true };
    }),

  getAuditLogs: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      return db.getAuditLogs(input?.limit ?? 100);
    }),

  getDashboard: adminProcedure.query(async () => {
    const kpis = await db.getAdminDashboardKpis();
    return {
      kpis,
      systemHealth: {
        status: "healthy",
        services: [
          { name: "database", status: "healthy" },
          { name: "api", status: "healthy" },
        ],
        generatedAt: new Date().toISOString(),
      },
    };
  }),

  getEvents: adminProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(500).default(100),
      studentId: z.number().int().optional(),
    }))
    .query(async ({ input }) => {
      return db.getPracticeEvents(input.limit, input.studentId);
    }),

  createSkill: adminProcedure
    .input(z.object({
      domainId: z.number().int(),
      name: z.string().min(1).max(200),
      slug: z.string().min(1).max(200),
      description: z.string().optional(),
      gradeLevel: z.number().int().min(1).max(12),
      displayOrder: z.number().int().optional(),
      prerequisiteSkillId: z.number().int().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createMathSkill(input);
      await db.createAuditLog({
        adminId: ctx.user.id,
        action: "CREATE_SKILL",
        resourceType: "mathSkills",
        resourceId: String(result?.id),
        changes: { created: input },
      });
      return { skillId: result?.id };
    }),

  updateSkill: adminProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().optional(),
      gradeLevel: z.number().int().min(1).max(12).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateMathSkill(id, data);
      await db.createAuditLog({
        adminId: ctx.user.id,
        action: "UPDATE_SKILL",
        resourceType: "mathSkills",
        resourceId: String(id),
        changes: { updated: data },
      });
      return { success: true };
    }),

  createProblem: adminProcedure
    .input(z.object({
      skillId: z.number().int(),
      problemType: z.enum(["multiple_choice", "numeric_input", "true_false", "fill_blank", "comparison", "word_problem", "ordering"]),
      difficulty: z.number().int().min(1).max(5),
      questionText: z.string().min(1),
      correctAnswer: z.string().min(1),
      answerType: z.enum(["number", "text", "boolean", "choice"]),
      choices: z.any().optional(),
      explanation: z.string().min(1),
      hintSteps: z.array(z.string()).optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createMathProblem({
        ...input,
        hintSteps: input.hintSteps ?? [],
      });
      await db.createAuditLog({
        adminId: ctx.user.id,
        action: "CREATE_PROBLEM",
        resourceType: "mathProblems",
        resourceId: String(result?.id),
        changes: { created: { skillId: input.skillId, difficulty: input.difficulty } },
      });
      return { problemId: result?.id };
    }),

  updateProblem: adminProcedure
    .input(z.object({
      id: z.number().int(),
      questionText: z.string().optional(),
      correctAnswer: z.string().optional(),
      explanation: z.string().optional(),
      difficulty: z.number().int().min(1).max(5).optional(),
      isActive: z.boolean().optional(),
      hintSteps: z.array(z.string()).optional(),
      tags: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await db.updateMathProblem(id, data as any);
      await db.createAuditLog({
        adminId: ctx.user.id,
        action: "UPDATE_PROBLEM",
        resourceType: "mathProblems",
        resourceId: String(id),
        changes: { updated: data },
      });
      return { success: true };
    }),

  deactivateProblem: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await db.deactivateMathProblem(input.id);
      await db.createAuditLog({
        adminId: ctx.user.id,
        action: "DEACTIVATE_PROBLEM",
        resourceType: "mathProblems",
        resourceId: String(input.id),
        changes: { isActive: false },
      });
      return { success: true };
    }),

  getSystemHealth: adminProcedure.query(async () => {
    let dbStatus = "healthy";
    try {
      await db.getAdminDashboardKpis();
    } catch {
      dbStatus = "degraded";
    }

    return {
      status: dbStatus === "healthy" ? "healthy" : "degraded",
      services: [
        { name: "database", status: dbStatus },
        { name: "api", status: "healthy" },
      ],
      generatedAt: new Date().toISOString(),
    };
  }),
});
