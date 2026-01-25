import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const successStoriesRouter = router({
  // Create a new success story (teacher action)
  create: protectedProcedure
    .input(z.object({
      studentId: z.number().int(),
      studentName: z.string().min(1).max(255),
      goalId: z.number().int(),
      goalName: z.string().min(1).max(255),
      goalType: z.enum(["accuracy", "score", "games_played", "streak", "topic_mastery"]),
      targetValue: z.number().int(),
      achievedValue: z.number().int(),
      title: z.string().min(1).max(255),
      description: z.string().min(10),
      testimonial: z.string().min(10).max(1000).optional(),
      tips: z.string().min(10).max(500).optional(),
      imageUrl: z.string().optional(),
      impactScore: z.number().int().min(0).max(100).optional(),
      receivedAlerts: z.boolean().optional(),
      alertsCount: z.number().int().optional(),
      daysToAchieve: z.number().int().optional(),
      classId: z.number().int().optional(),
      isPublished: z.boolean().default(false),
      isFeature: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify teacher owns this class if classId provided
      if (input.classId) {
        const classRecord = await db.getClassById(input.classId);
        if (!classRecord || classRecord.teacherId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to create stories for this class",
          });
        }
      }

      const story = await db.createSuccessStory({
        studentId: input.studentId,
        studentName: input.studentName,
        goalId: input.goalId,
        goalName: input.goalName,
        goalType: input.goalType,
        targetValue: input.targetValue,
        achievedValue: input.achievedValue,
        title: input.title,
        description: input.description,
        testimonial: input.testimonial,
        tips: input.tips,
        imageUrl: input.imageUrl,
        impactScore: input.impactScore,
        receivedAlerts: input.receivedAlerts,
        alertsCount: input.alertsCount,
        daysToAchieve: input.daysToAchieve,
        classId: input.classId,
      });

      return story;
    }),

  // Get success stories with optional filters
  getStories: protectedProcedure
    .input(z.object({
      classId: z.number().int().optional(),
      goalType: z.string().optional(),
      isPublished: z.boolean().optional(),
      isFeature: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const stories = await db.getSuccessStories({
        classId: input.classId,
        goalType: input.goalType,
        isPublished: input.isPublished,
        isFeature: input.isFeature,
        limit: input.limit,
        offset: input.offset,
      });

      return stories;
    }),

  // Get a single success story by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const story = await db.getSuccessStoryById(input.id);
      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Success story not found",
        });
      }

      return story;
    }),

  // Update a success story (teacher action)
  update: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      testimonial: z.string().min(10).max(1000).optional(),
      tips: z.string().min(10).max(500).optional(),
      imageUrl: z.string().optional(),
      impactScore: z.number().int().min(0).max(100).optional(),
      isPublished: z.boolean().optional(),
      isFeature: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const story = await db.getSuccessStoryById(input.id);
      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Success story not found",
        });
      }

      const updated = await db.updateSuccessStory(input.id, {
        testimonial: input.testimonial,
        tips: input.tips,
        imageUrl: input.imageUrl,
        impactScore: input.impactScore,
        isPublished: input.isPublished,
        isFeature: input.isFeature,
      });

      return updated;
    }),

  // Delete a success story
  delete: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const story = await db.getSuccessStoryById(input.id);
      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Success story not found",
        });
      }

      await db.deleteSuccessStory(input.id);
      return { success: true };
    }),

  // Add a reaction/like to a story (student action)
  addReaction: protectedProcedure
    .input(z.object({
      storyId: z.number().int(),
      reactionType: z.enum(["like", "inspired", "helpful", "motivating"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const story = await db.getSuccessStoryById(input.storyId);
      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Success story not found",
        });
      }

      // Check if user already reacted
      const existing = await db.getSuccessStoryReaction(
        input.storyId,
        ctx.user.id
      );

      if (existing) {
        // Update existing reaction
        const updated = await db.updateSuccessStoryReaction(
          input.storyId,
          ctx.user.id,
          input.reactionType
        );
        return updated;
      } else {
        // Create new reaction
        const reaction = await db.createSuccessStoryReaction({
          storyId: input.storyId,
          studentId: ctx.user.id,
          reactionType: input.reactionType,
        });
        return reaction;
      }
    }),

  // Remove a reaction from a story
  removeReaction: protectedProcedure
    .input(z.object({ storyId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteSuccessStoryReaction(input.storyId, ctx.user.id);
      return { success: true };
    }),

  // Get reactions for a story
  getReactions: protectedProcedure
    .input(z.object({ storyId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const reactions = await db.getSuccessStoryReactions(input.storyId);
      return reactions;
    }),

  // Add a comment to a story
  addComment: protectedProcedure
    .input(z.object({
      storyId: z.number().int(),
      comment: z.string().min(1).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const story = await db.getSuccessStoryById(input.storyId);
      if (!story) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Success story not found",
        });
      }

      const newComment = await db.createSuccessStoryComment({
        storyId: input.storyId,
        studentId: ctx.user.id,
        studentName: ctx.user.name || "Anonymous",
        comment: input.comment,
        isApproved: true,
      });

      return newComment;
    }),

  // Get comments for a story (approved only)
  getComments: protectedProcedure
    .input(z.object({ storyId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const comments = await db.getSuccessStoryComments(input.storyId, true);
      return comments;
    }),

  // Delete a comment (student can delete own, teacher can delete any)
  deleteComment: protectedProcedure
    .input(z.object({ commentId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const comment = await db.getSuccessStoryCommentById(input.commentId);
      if (!comment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Comment not found",
        });
      }

      // Check permission (student can delete own)
      if (comment.studentId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this comment",
        });
      }

      await db.deleteSuccessStoryComment(input.commentId);
      return { success: true };
    }),

  // Get featured stories for a class (public view)
  getFeaturedStories: protectedProcedure
    .input(z.object({ classId: z.number().int() }))
    .query(async ({ input }) => {
      const stories = await db.getSuccessStories({
        classId: input.classId,
        isFeature: true,
        limit: 10,
      });
      return stories;
    }),

  // Get success stories with stats (for dashboard)
  getStoriesWithStats: protectedProcedure
    .input(z.object({ classId: z.number().int().optional() }))
    .query(async ({ input }) => {
      const stories = await db.getSuccessStoriesWithStats(input.classId);
      return stories;
    })
});
