import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

export const collaborativeBundleRouter = router({
  // Create a new collaborative bundle
  createBundle: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        schoolName: z.string().optional(),
        bundleType: z.enum(["grade_level", "school_wide", "custom"]).default("custom"),
        maxContributors: z.number().int().min(1).default(10),
        requiresApproval: z.boolean().default(true),
        primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
        secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
        organizationMethod: z.enum(["by-class", "by-goal", "chronological"]).default("by-class"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const bundle = await db.createCollaborativeBundle({
        title: input.title,
        description: input.description,
        createdBy: ctx.user.id,
        schoolName: input.schoolName,
        bundleType: input.bundleType,
        status: "draft",
        maxContributors: input.maxContributors,
        requiresApproval: input.requiresApproval,
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
        organizationMethod: input.organizationMethod,
      });

      // Add creator as contributor
      await db.addBundleContributor({
        bundleId: bundle.id,
        teacherId: ctx.user.id,
        role: "creator",
        status: "accepted",
      });

      // Create initial version
      await db.createBundleVersion({
        bundleId: bundle.id,
        versionNumber: 1,
        createdBy: ctx.user.id,
        changeDescription: "Bundle created",
        storyCount: 0,
      });

      return bundle;
    }),

  // Get bundles created by teacher
  getMyBundles: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return db.getTeacherBundles(ctx.user.id);
  }),

  // Get bundles teacher is contributing to
  getContributingBundles: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
    return db.getContributorBundles(ctx.user.id);
  }),

  // Get bundle details
  getBundle: protectedProcedure
    .input(z.object({ bundleId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const bundle = await db.getCollaborativeBundleById(input.bundleId);
      if (!bundle) throw new TRPCError({ code: "NOT_FOUND" });

      // Check access
      const role = await db.getTeacherBundleRole(input.bundleId, ctx.user.id);
      if (!role) throw new TRPCError({ code: "FORBIDDEN" });

      return bundle;
    }),

  // Invite contributor to bundle
  inviteContributor: protectedProcedure
    .input(
      z.object({
        bundleId: z.number().int(),
        teacherId: z.number().int(),
        role: z.enum(["contributor", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const bundle = await db.getCollaborativeBundleById(input.bundleId);
      if (!bundle) throw new TRPCError({ code: "NOT_FOUND" });

      // Only creator can invite
      if (bundle.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Check contributor limit
      const contributors = await db.getBundleContributors(input.bundleId);
      const maxContributors = bundle.maxContributors || 10;
      if (contributors.length >= maxContributors) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bundle has reached maximum contributors",
        });
      }

      // Check if already invited
      const existing = contributors.find((c) => c.teacherId === input.teacherId);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Teacher already invited to this bundle",
        });
      }

      const contributor = await db.addBundleContributor({
        bundleId: input.bundleId,
        teacherId: input.teacherId,
        role: input.role,
        status: "invited",
      });

      // Create notification
      await db.createBundleNotification({
        bundleId: input.bundleId,
        recipientId: input.teacherId,
        notificationType: "invitation",
        message: `You've been invited to contribute to "${bundle.title}"`,
      });

      return contributor;
    }),

  // Accept bundle invitation
  acceptInvitation: protectedProcedure
    .input(z.object({ bundleId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const role = await db.getTeacherBundleRole(input.bundleId, ctx.user.id);
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });
      if (role.status !== "invited") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No pending invitation" });
      }

      const updated = await db.updateBundleContributor(role.id, {
        status: "accepted",
        acceptedAt: new Date(),
        joinedAt: new Date(),
      });

      return updated;
    }),

  // Decline bundle invitation
  declineInvitation: protectedProcedure
    .input(z.object({ bundleId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const role = await db.getTeacherBundleRole(input.bundleId, ctx.user.id);
      if (!role) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await db.updateBundleContributor(role.id, {
        status: "declined",
      });

      return updated;
    }),

  // Add story to bundle
  addStoryToBundle: protectedProcedure
    .input(
      z.object({
        bundleId: z.number().int(),
        storyId: z.number().int(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const bundle = await db.getCollaborativeBundleById(input.bundleId);
      if (!bundle) throw new TRPCError({ code: "NOT_FOUND" });

      const role = await db.getTeacherBundleRole(input.bundleId, ctx.user.id);
      if (!role || role.role === "viewer") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const bundleStory = await db.addStoryToBundle({
        bundleId: input.bundleId,
        storyId: input.storyId,
        addedBy: ctx.user.id,
        status: bundle.requiresApproval ? "pending" : "approved",
      });

      // Create notification for creators/approvers
      const contributors = await db.getBundleContributors(input.bundleId);
      for (const contributor of contributors) {
        if (contributor.role === "creator" && contributor.teacherId !== ctx.user.id) {
          await db.createBundleNotification({
            bundleId: input.bundleId,
            recipientId: contributor.teacherId,
            notificationType: "story_added",
            message: `New story added to "${bundle.title}"`,
            relatedStoryId: input.storyId,
          });
        }
      }

      return bundleStory;
    }),

  // Get bundle stories
  getBundleStories: protectedProcedure
    .input(
      z.object({
        bundleId: z.number().int(),
        status: z.enum(["pending", "approved", "rejected", "removed"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const role = await db.getTeacherBundleRole(input.bundleId, ctx.user.id);
      if (!role) throw new TRPCError({ code: "FORBIDDEN" });

      return db.getBundleStories(input.bundleId, input.status);
    }),

  // Approve story for bundle
  approveStory: protectedProcedure
    .input(
      z.object({
        bundleStoryId: z.number().int(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get bundle story
      const bundleStories = await db.getBundleStories(0);
      const bundleStory = bundleStories.find((bs) => bs.id === input.bundleStoryId);
      if (!bundleStory) throw new TRPCError({ code: "NOT_FOUND" });

      const bundle = await db.getCollaborativeBundleById(bundleStory.bundleId);
      if (!bundle) throw new TRPCError({ code: "NOT_FOUND" });

      // Only creator can approve
      if (bundle.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Update story status
      const updated = await db.updateBundleStory(input.bundleStoryId, {
        status: "approved",
        approvedBy: ctx.user.id,
        approvedAt: new Date(),
      });

      // Create approval record
      await db.createBundleApproval({
        bundleStoryId: input.bundleStoryId,
        reviewedBy: ctx.user.id,
        status: "approved",
        comments: input.comments,
      });

      // Notify contributor
      if (bundleStory.addedBy !== ctx.user.id) {
        await db.createBundleNotification({
          bundleId: bundleStory.bundleId,
          recipientId: bundleStory.addedBy,
          notificationType: "story_approved",
          message: `Your story was approved for "${bundle.title}"`,
          relatedStoryId: bundleStory.storyId,
        });
      }

      return updated;
    }),

  // Reject story for bundle
  rejectStory: protectedProcedure
    .input(
      z.object({
        bundleStoryId: z.number().int(),
        rejectionReason: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      // Get bundle story
      const bundleStories = await db.getBundleStories(0);
      const bundleStory = bundleStories.find((bs) => bs.id === input.bundleStoryId);
      if (!bundleStory) throw new TRPCError({ code: "NOT_FOUND" });

      const bundle = await db.getCollaborativeBundleById(bundleStory.bundleId);
      if (!bundle) throw new TRPCError({ code: "NOT_FOUND" });

      // Only creator can reject
      if (bundle.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Update story status
      const updated = await db.updateBundleStory(input.bundleStoryId, {
        status: "rejected",
        approvedBy: ctx.user.id,
        rejectionReason: input.rejectionReason,
      });

      // Create approval record
      await db.createBundleApproval({
        bundleStoryId: input.bundleStoryId,
        reviewedBy: ctx.user.id,
        status: "rejected",
        comments: input.rejectionReason,
      });

      // Notify contributor
      if (bundleStory.addedBy !== ctx.user.id) {
        await db.createBundleNotification({
          bundleId: bundleStory.bundleId,
          recipientId: bundleStory.addedBy,
          notificationType: "story_rejected",
          message: `Your story was rejected: ${input.rejectionReason}`,
          relatedStoryId: bundleStory.storyId,
        });
      }

      return updated;
    }),

  // Get bundle versions
  getBundleVersions: protectedProcedure
    .input(z.object({ bundleId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const role = await db.getTeacherBundleRole(input.bundleId, ctx.user.id);
      if (!role) throw new TRPCError({ code: "FORBIDDEN" });

      return db.getBundleVersions(input.bundleId);
    }),

  // Get teacher notifications
  getNotifications: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return db.getTeacherNotifications(ctx.user.id, input.unreadOnly);
    }),

  // Mark notification as read
  markNotificationAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
      return db.markNotificationAsRead(input.notificationId);
    }),

  // Update bundle status
  updateBundleStatus: protectedProcedure
    .input(
      z.object({
        bundleId: z.number().int(),
        status: z.enum(["draft", "active", "archived"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });

      const bundle = await db.getCollaborativeBundleById(input.bundleId);
      if (!bundle) throw new TRPCError({ code: "NOT_FOUND" });

      // Only creator can update status
      if (bundle.createdBy !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const updated = await db.updateCollaborativeBundle(input.bundleId, {
        status: input.status,
      });

      return updated;
    }),
});
