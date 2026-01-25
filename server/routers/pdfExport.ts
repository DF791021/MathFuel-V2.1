import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { generateSuccessStoriesPDF, SuccessStoryData, ReportOptions } from "../_core/pdfExport";
import * as db from "../db";

/**
 * PDF Export Router
 * Handles all PDF generation and export operations for success stories
 */
export const pdfExportRouter = router({
  /**
   * Generate and download a PDF report of class success stories
   */
  generateSuccessStoriesReport: protectedProcedure
    .input(
      z.object({
        classId: z.number(),
        dateRange: z
          .object({
            startDate: z.date(),
            endDate: z.date(),
          })
          .optional(),
        goalType: z.string().optional(),
        includeMetrics: z.boolean().default(true),
        includeTestimonials: z.boolean().default(true),
        includeTips: z.boolean().default(true),
        teacherNotes: z.string().optional(),
        schoolName: z.string().optional(),
        schoolLogo: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify class ownership
      const classData = await db.getClassById(input.classId);
      if (!classData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      if (classData.teacherId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to export this class's stories",
        });
      }

      // Fetch success stories for the class
      const stories = await db.getSuccessStoriesWithStats(input.classId);

      if (!stories || stories.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No success stories found for this class",
        });
      }

      // Filter by date range if provided
      let filteredStories = stories;
      if (input.dateRange) {
        filteredStories = stories.filter((story) => {
          const storyDate = new Date(story.createdAt);
          return (
            storyDate >= input.dateRange!.startDate &&
            storyDate <= input.dateRange!.endDate
          );
        });
      }

      // Filter by goal type if provided
      if (input.goalType) {
        filteredStories = filteredStories.filter(
          (story) => story.goalType === input.goalType
        );
      }

      if (filteredStories.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No success stories match the specified filters",
        });
      }

      // Convert stories to PDF format
      const pdfStories: SuccessStoryData[] = filteredStories.map((story) => ({
        id: story.id,
        studentName: story.studentName,
        goalName: story.goalName,
        goalType: story.goalType,
        title: story.title,
        description: story.description,
        testimonial: story.testimonial,
        tips: story.tips,
        impactScore: story.impactScore,
        createdAt: new Date(story.createdAt),
        reactionCount: story.reactionCounts
          ? Object.values(story.reactionCounts).reduce((a, b) => a + b, 0)
          : 0,
        commentCount: story.commentCount || 0,
      }));

      // Prepare report options
      const reportOptions: ReportOptions = {
        className: classData.name,
        schoolName: input.schoolName,
        schoolLogo: input.schoolLogo,
        teacherName: ctx.user.name || 'Teacher',
        reportDate: new Date(),
        dateRange: input.dateRange,
        includeMetrics: input.includeMetrics,
        includeTestimonials: input.includeTestimonials,
        includeTips: input.includeTips,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        teacherNotes: input.teacherNotes,
      };

      // Generate PDF
      const pdfBuffer = await generateSuccessStoriesPDF(pdfStories, reportOptions);

      // Save export history
      await db.saveExportHistory({
        teacherId: ctx.user.id,
        classId: input.classId,
        exportType: "success_stories",
        storyCount: filteredStories.length,
        dateRange: input.dateRange,
        options: {
          includeMetrics: input.includeMetrics,
          includeTestimonials: input.includeTestimonials,
          includeTips: input.includeTips,
        },
      });

      // Return PDF as base64 for download
      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `success-stories-${classData.name.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`,
        mimeType: "application/pdf",
      };
    }),

  /**
   * Get export history for a class
   */
  getExportHistory: protectedProcedure
    .input(
      z.object({
        classId: z.number(),
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify class ownership
      const classData = await db.getClassById(input.classId);
      if (!classData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Class not found",
        });
      }

      if (classData.teacherId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view this class's export history",
        });
      }

      // Fetch export history
      const history = await db.getExportHistory(input.classId, input.limit, input.offset);
      const total = await db.getExportHistoryCount(input.classId);

      return {
        history,
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Delete an export history record
   */
  deleteExportHistory: protectedProcedure
    .input(z.object({ exportId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const exportRecord = await db.getExportHistoryById(input.exportId);
      if (!exportRecord) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Export record not found",
        });
      }

      if (exportRecord.teacherId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this export record",
        });
      }

      await db.deleteExportHistory(input.exportId);

      return { success: true };
    }),

  /**
   * Get export statistics for a teacher
   */
  getExportStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await db.getExportStats(ctx.user.id);
    return stats;
  }),

  /**
   * Generate a consolidated PDF report from multiple classes
   */
  generateMultiClassBundle: protectedProcedure
    .input(
      z.object({
        classIds: z.array(z.number()).min(1),
        bundleTitle: z.string().optional(),
        dateRange: z
          .object({
            startDate: z.date(),
            endDate: z.date(),
          })
          .optional(),
        goalType: z.string().optional(),
        includeMetrics: z.boolean().default(true),
        includeTestimonials: z.boolean().default(true),
        includeTips: z.boolean().default(true),
        teacherNotes: z.string().optional(),
        schoolName: z.string().optional(),
        schoolLogo: z.string().optional(),
        primaryColor: z.string().optional(),
        secondaryColor: z.string().optional(),
        organizationMethod: z.enum(["by-class", "by-goal", "chronological"]).default("by-class"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership of all classes
      const classesData = await Promise.all(
        input.classIds.map((classId) => db.getClassById(classId))
      );

      for (const classData of classesData) {
        if (!classData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more classes not found",
          });
        }

        if (classData.teacherId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to export one or more of these classes",
          });
        }
      }

      // Fetch all stories from all classes
      const allStories = await Promise.all(
        input.classIds.map((classId) => db.getSuccessStoriesWithStats(classId))
      );

      const flattenedStories = allStories.flat();

      if (!flattenedStories || flattenedStories.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No success stories found across selected classes",
        });
      }

      // Filter by date range if provided
      let filteredStories = flattenedStories;
      if (input.dateRange) {
        filteredStories = flattenedStories.filter((story) => {
          const storyDate = new Date(story.createdAt);
          return (
            storyDate >= input.dateRange!.startDate &&
            storyDate <= input.dateRange!.endDate
          );
        });
      }

      // Filter by goal type if provided
      if (input.goalType) {
        filteredStories = filteredStories.filter(
          (story) => story.goalType === input.goalType
        );
      }

      if (filteredStories.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No success stories match the specified filters across selected classes",
        });
      }

      // Organize stories based on method
      let organizedStories = filteredStories;
      if (input.organizationMethod === "by-goal") {
        organizedStories = filteredStories.sort((a, b) =>
          a.goalType.localeCompare(b.goalType)
        );
      } else if (input.organizationMethod === "chronological") {
        organizedStories = filteredStories.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      // Convert stories to PDF format
      const pdfStories: SuccessStoryData[] = organizedStories.map((story) => ({
        id: story.id,
        studentName: story.studentName,
        goalName: story.goalName,
        goalType: story.goalType,
        title: story.title,
        description: story.description,
        testimonial: story.testimonial,
        tips: story.tips,
        impactScore: story.impactScore,
        createdAt: new Date(story.createdAt),
        reactionCount: story.reactionCounts
          ? Object.values(story.reactionCounts).reduce((a, b) => a + b, 0)
          : 0,
        commentCount: story.commentCount || 0,
      }));

      // Prepare report options
      const classNames = classesData
        .filter((c): c is NonNullable<typeof c> => c !== null)
        .map((c) => c.name)
        .join(", ");
      const reportOptions: ReportOptions = {
        className: input.bundleTitle || `Multi-Class Bundle: ${classNames}`,
        schoolName: input.schoolName,
        schoolLogo: input.schoolLogo,
        teacherName: ctx.user.name || "Teacher",
        reportDate: new Date(),
        dateRange: input.dateRange,
        includeMetrics: input.includeMetrics,
        includeTestimonials: input.includeTestimonials,
        includeTips: input.includeTips,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        teacherNotes: input.teacherNotes,
        isMultiClass: true,
        classCount: input.classIds.length,
      };

      // Generate PDF
      const pdfBuffer = await generateSuccessStoriesPDF(pdfStories, reportOptions);

      // Save export history
      await db.saveExportHistory({
        teacherId: ctx.user.id,
        classId: input.classIds[0],
        exportType: "multi_class_bundle",
        storyCount: filteredStories.length,
        dateRange: input.dateRange,
        options: {
          classIds: input.classIds,
          includeMetrics: input.includeMetrics,
          includeTestimonials: input.includeTestimonials,
          includeTips: input.includeTips,
          organizationMethod: input.organizationMethod,
        },
      });

      // Return PDF as base64 for download
      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `success-stories-bundle-${new Date().toISOString().split("T")[0]}.pdf`,
        mimeType: "application/pdf",
      };
    }),

  /**
   * Get available classes for bundling
   */
  getClassesForBundling: protectedProcedure.query(async ({ ctx }) => {
    const classes = await db.getTeacherClasses(ctx.user.id);
    
    // Fetch story count for each class
    const classesWithCounts = await Promise.all(
      classes.map(async (classData) => {
        const stories = await db.getSuccessStoriesWithStats(classData.id);
        return {
          ...classData,
          storyCount: stories?.length || 0,
        };
      })
    );

    return classesWithCounts;
  }),

  /**
   * Preview stories from selected classes before bundling
   */
  previewBundleStories: protectedProcedure
    .input(
      z.object({
        classIds: z.array(z.number()).min(1),
        dateRange: z
          .object({
            startDate: z.date(),
            endDate: z.date(),
          })
          .optional(),
        goalType: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify ownership of all classes
      const classesData = await Promise.all(
        input.classIds.map((classId) => db.getClassById(classId))
      );

      for (const classData of classesData) {
        if (!classData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "One or more classes not found",
          });
        }

        if (classData.teacherId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to preview one or more of these classes",
          });
        }
      }

      // Fetch all stories from all classes
      const allStories = await Promise.all(
        input.classIds.map((classId) => db.getSuccessStoriesWithStats(classId))
      );

      let filteredStories = allStories.flat();

      // Filter by date range if provided
      if (input.dateRange) {
        filteredStories = filteredStories.filter((story) => {
          const storyDate = new Date(story.createdAt);
          return (
            storyDate >= input.dateRange!.startDate &&
            storyDate <= input.dateRange!.endDate
          );
        });
      }

      // Filter by goal type if provided
      if (input.goalType) {
        filteredStories = filteredStories.filter(
          (story) => story.goalType === input.goalType
        );
      }

      // Group by class for preview
      const storyByClass = new Map<number, typeof filteredStories>();
      for (const story of filteredStories) {
        const classId = input.classIds[0]; // In real scenario, we'd track which class each story belongs to
        if (!storyByClass.has(classId)) {
          storyByClass.set(classId, []);
        }
        storyByClass.get(classId)!.push(story);
      }

      return {
        totalStories: filteredStories.length,
        storiesByClass: Object.fromEntries(
          classesData
            .filter((c): c is NonNullable<typeof c> => c !== null)
            .map((c) => [
              c.id,
              {
                className: c.name,
                count: filteredStories.filter((s) => s.classId === c.id).length,
              },
            ])
        ),
        stories: filteredStories.slice(0, 10), // Return first 10 for preview
      };
    }),
});
