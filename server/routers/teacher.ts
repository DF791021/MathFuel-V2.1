import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

const teacherProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.userType !== "teacher" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Teacher access required" });
  }
  return next({ ctx });
});

export const teacherRouter = router({
  createClassroom: teacherProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      gradeLevel: z.number().int().min(1).max(12).optional(),
      schoolName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.createClassroom({
        name: input.name,
        gradeLevel: input.gradeLevel ?? null,
        schoolName: input.schoolName ?? null,
        teacherUserId: ctx.user.id,
      });
      return { classroomId: result?.id ?? null };
    }),

  getMyClassrooms: teacherProcedure.query(async ({ ctx }) => {
    return db.getClassroomsByTeacher(ctx.user.id);
  }),

  updateClassroom: teacherProcedure
    .input(z.object({
      classroomId: z.number().int(),
      name: z.string().min(1).max(200).optional(),
      gradeLevel: z.number().int().min(1).max(12).optional(),
      schoolName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom || classroom.teacherUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Classroom not found or access denied" });
      }
      await db.updateClassroom(input.classroomId, {
        name: input.name ?? classroom.name,
        gradeLevel: input.gradeLevel ?? classroom.gradeLevel,
        schoolName: input.schoolName ?? classroom.schoolName,
      });
      return { success: true };
    }),

  addStudent: teacherProcedure
    .input(z.object({
      classroomId: z.number().int(),
      studentId: z.number().int(),
    }))
    .mutation(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom || classroom.teacherUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Classroom not found or access denied" });
      }
      await db.addStudentToClassroom(input.classroomId, input.studentId);
      return { success: true };
    }),

  removeStudent: teacherProcedure
    .input(z.object({
      classroomId: z.number().int(),
      studentId: z.number().int(),
    }))
    .mutation(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom || classroom.teacherUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Classroom not found or access denied" });
      }
      await db.removeStudentFromClassroom(input.classroomId, input.studentId);
      return { success: true };
    }),

  getClassroomDashboard: teacherProcedure
    .input(z.object({ classroomId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom || classroom.teacherUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Classroom not found or access denied" });
      }

      const students = await db.getClassroomStudentsWithMastery(input.classroomId);
      const engagement = await db.getClassroomEngagement(input.classroomId);

      const avgAccuracy = students.length > 0
        ? students.reduce((s, st) => s + st.avgMastery, 0) / students.length
        : 0;
      const avgConfidence = students.length > 0
        ? students.reduce((s, st) => s + st.avgConfidence, 0) / students.length
        : 0;

      const activeThisWeek = engagement.filter(e => e.sessionsThisWeek > 0).length;

      const needsAttention = students
        .filter(s => s.avgConfidence < 0.4 || s.avgMastery < 40)
        .map(s => ({
          studentId: s.id,
          displayName: s.name ?? "Student",
          reason: s.avgConfidence < 0.4 ? "low_confidence" : "low_mastery",
        }));

      return {
        classroom: {
          id: classroom.id,
          name: classroom.name,
          gradeLevel: classroom.gradeLevel,
          schoolName: classroom.schoolName,
        },
        overview: {
          studentCount: students.length,
          activeThisWeek,
          avgAccuracy: Math.round(avgAccuracy),
          avgConfidence: Math.round(avgConfidence * 100) / 100,
        },
        needsAttention,
        students,
      };
    }),

  getStudentMastery: teacherProcedure
    .input(z.object({
      classroomId: z.number().int(),
      studentId: z.number().int(),
    }))
    .query(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom || classroom.teacherUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Classroom not found or access denied" });
      }

      const studentIds = await db.getClassroomStudentIds(input.classroomId);
      if (!studentIds.includes(input.studentId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Student not in this classroom" });
      }

      const [mastery, streak] = await Promise.all([
        db.getStudentMasteryWithSkills(input.studentId),
        db.getStudentStreak(input.studentId),
      ]);

      return {
        studentId: input.studentId,
        streak: streak ?? { currentStreak: 0, longestStreak: 0 },
        skills: mastery,
      };
    }),

  getClassroomEngagement: teacherProcedure
    .input(z.object({ classroomId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const classroom = await db.getClassroomById(input.classroomId);
      if (!classroom || classroom.teacherUserId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Classroom not found or access denied" });
      }

      const engagement = await db.getClassroomEngagement(input.classroomId);
      const totalSessions = engagement.reduce((s, e) => s + e.sessionsThisWeek, 0);

      return {
        overview: {
          weeklySessions: totalSessions,
          avgAccuracy: engagement.length > 0
            ? Math.round(engagement.reduce((s, e) => s + e.avgAccuracy, 0) / engagement.length * 100) / 100
            : 0,
        },
        students: engagement,
      };
    }),
});
