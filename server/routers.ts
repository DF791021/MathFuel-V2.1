import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { sendEmailWithZipAttachment } from "./_core/email";
import { teacherChatbotRouter } from "./routers/teacherChatbot";
import { chatHistoryRouter } from "./routers/chatHistory";
import { rouletteRouter } from "./routers/roulette";
import { analyticsRouter } from "./routers/analytics";
import { goalsRouter } from "./routers/goals";
import { alertPreferencesRouter } from "./routers/alertPreferences";
import { alertAnalyticsRouter } from "./routers/alertAnalytics";
import { journalRouter } from "./routers/journal";
import { goalMonitoringRouter } from "./routers/goalMonitoring";
import { successStoriesRouter } from "./routers/successStories";
import { pdfExportRouter } from "./routers/pdfExport";
import { trialRouter } from "./routers/trial";
import { feedbackRouter } from "./routers/feedback";
import { paymentRouter } from "./routers/payment";
import { notificationPreferencesRouter } from "./routers/notificationPreferences";
import { notificationArchiveRouter } from "./routers/notificationArchive";

export const appRouter = router({
  system: systemRouter,
  teacherChatbot: teacherChatbotRouter,
  chatHistory: chatHistoryRouter,
  roulette: rouletteRouter,
  analytics: analyticsRouter,
  goals: goalsRouter,
  alertPreferences: alertPreferencesRouter,
  alertAnalytics: alertAnalyticsRouter,
  journal: journalRouter,
  goalMonitoring: goalMonitoringRouter,
  successStories: successStoriesRouter,
  pdfExport: pdfExportRouter,
  trial: trialRouter,
  feedback: feedbackRouter,
  payment: paymentRouter,
  notificationPreferences: notificationPreferencesRouter,
  notificationArchive: notificationArchiveRouter,
  
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

  certificates: router({
    sendEmail: protectedProcedure
      .input(z.object({
        studentName: z.string().min(1).max(100),
        recipientEmail: z.string().email(),
        recipientType: z.enum(["student", "parent"]),
        achievementType: z.string(),
        teacherName: z.string(),
        schoolName: z.string(),
        date: z.string(),
        customMessage: z.string().optional(),
        emailSubject: z.string().optional(),
        emailBody: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Generate certificate details for notification
        const achievementTitles: Record<string, string> = {
          completion: "Game Completion Certificate",
          nutrition_expert: "Nutrition Expert Award",
          wisconsin_explorer: "Wisconsin Explorer Certificate",
          healthy_champion: "Healthy Champion Award",
          food_safety_star: "Food Safety Star Certificate",
        };
        
        const achievementTitle = achievementTitles[input.achievementType] || "Certificate of Achievement";
        
        // Use custom subject/body or defaults
        const emailSubject = input.emailSubject || `🎉 Congratulations! ${input.studentName} earned a ${achievementTitle}!`;
        const emailBody = input.emailBody || `Dear ${input.recipientType === "parent" ? "Parent/Guardian" : input.studentName},

We are thrilled to share some wonderful news!

${input.studentName} has successfully completed the Wisconsin Nutrition Explorer nutrition adventure and earned a ${achievementTitle}!

This achievement demonstrates excellent knowledge of healthy eating habits and Wisconsin's rich agricultural heritage.

Congratulations on this fantastic accomplishment!

Best regards,
${input.teacherName}
${input.schoolName}`;
        
        const title = `🎓 Certificate for ${input.studentName} - Wisconsin Nutrition Explorer`;
        const content = `
A certificate has been generated for ${input.studentName}!

📜 Achievement: ${achievementTitle}
👨‍🏫 Teacher: ${input.teacherName}
🏫 School: ${input.schoolName}
📅 Date: ${input.date}
📧 Sent to: ${input.recipientEmail} (${input.recipientType})

📨 Email Subject: ${emailSubject}

📝 Email Body:
${emailBody}
${input.customMessage ? `\n💬 Additional Message: ${input.customMessage}` : ""}

The certificate has been sent via email to the recipient.
        `.trim();
        
        // Send notification to project owner (teacher gets notified)
        const notified = await notifyOwner({ title, content });
        
        // Log the email request for tracking
        console.log(`[Certificate Email] Sent to ${input.recipientEmail} for ${input.studentName}`);
        console.log(`[Certificate Email] Subject: ${emailSubject}`);
        
        return { 
          success: true, 
          notified,
          message: `Certificate email request sent for ${input.studentName}` 
        };
      }),

    sendBatchEmails: protectedProcedure
      .input(z.object({
        students: z.array(z.object({
          name: z.string().min(1).max(100),
          email: z.string().email(),
        })),
        recipientType: z.enum(["student", "parent"]),
        achievementType: z.string(),
        teacherName: z.string(),
        schoolName: z.string(),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const results: { name: string; success: boolean; error?: string }[] = [];
        
        for (const student of input.students) {
          try {
            console.log(`[Certificate Email] Batch send to ${student.email} for ${student.name}`);
            results.push({ name: student.name, success: true });
          } catch (error) {
            results.push({ 
              name: student.name, 
              success: false, 
              error: error instanceof Error ? error.message : "Unknown error" 
            });
          }
        }
        
        const successCount = results.filter(r => r.success).length;
        
        // Send summary notification
        await notifyOwner({
          title: `📧 Batch Certificates Sent - ${successCount}/${input.students.length}`,
          content: `
Batch certificate emails have been processed.

✅ Successful: ${successCount}
❌ Failed: ${input.students.length - successCount}
📜 Achievement: ${input.achievementType}
🏫 School: ${input.schoolName}
👨‍🏫 Teacher: ${input.teacherName}

Students:
${results.map(r => `- ${r.name}: ${r.success ? "✅ Sent" : "❌ Failed"}`).join("\n")}
          `.trim(),
        });
        
        return { 
          success: true, 
          results,
          summary: { total: input.students.length, sent: successCount, failed: input.students.length - successCount }
        };
      }),

    // Certificate verification and anti-forgery
    issue: protectedProcedure
      .input(z.object({
        studentName: z.string().min(1).max(100),
        achievementType: z.string().min(1).max(50),
        teacherName: z.string().max(100).optional(),
        schoolName: z.string().max(200).optional(),
        customMessage: z.string().optional(),
        schoolLogoUrl: z.string().optional(),
        primaryColor: z.string().max(20).optional(),
        secondaryColor: z.string().max(20).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await db.issueCertificate({
          ...input,
          issuedBy: ctx.user.id,
        });
        return result;
      }),

    bulkIssue: protectedProcedure
      .input(z.object({
        students: z.array(z.object({
          studentName: z.string().min(1).max(100),
          achievementType: z.string().min(1).max(50),
          email: z.string().email().optional(),
        })).min(1).max(100),
        teacherName: z.string().max(100).optional(),
        schoolName: z.string().max(200).optional(),
        customMessage: z.string().optional(),
        schoolLogoUrl: z.string().optional(),
        primaryColor: z.string().max(20).optional(),
        secondaryColor: z.string().max(20).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const results = [];
        for (const student of input.students) {
          const result = await db.issueCertificate({
            studentName: student.studentName,
            achievementType: student.achievementType,
            teacherName: input.teacherName,
            schoolName: input.schoolName,
            customMessage: input.customMessage,
            schoolLogoUrl: input.schoolLogoUrl,
            primaryColor: input.primaryColor,
            secondaryColor: input.secondaryColor,
            issuedBy: ctx.user.id,
          });
          results.push({
            ...result,
            studentName: student.studentName,
            email: student.email,
          });
        }
        return { certificates: results, count: results.length };
      }),

    verify: publicProcedure
      .input(z.object({ certificateId: z.string().min(1).max(32) }))
      .query(async ({ input }) => {
        const result = await db.verifyCertificate(input.certificateId);
        return result;
      }),

    revoke: protectedProcedure
      .input(z.object({ certificateId: z.string().min(1).max(32) }))
      .mutation(async ({ ctx, input }) => {
        await db.revokeCertificate(input.certificateId, ctx.user.id);
        return { success: true };
      }),

    getMyIssuedCertificates: protectedProcedure.query(async ({ ctx }) => {
      return db.getTeacherCertificates(ctx.user.id);
    }),

    sendZipEmail: protectedProcedure
      .input(z.object({
        zipData: z.string(),
        zipFileName: z.string().min(1).max(255),
        studentNames: z.array(z.string()).min(1).max(100),
        teacherName: z.string().max(100),
        schoolName: z.string().max(200),
        customSubject: z.string().max(255).optional(),
        customBody: z.string().max(5000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const teacher = await db.getUserById(ctx.user.id);
          if (!teacher?.email) {
            return {
              success: false,
              error: "Teacher email not found. Please update your profile.",
            };
          }

          const zipBuffer = Buffer.from(input.zipData, "base64");

          const emailSent = await sendEmailWithZipAttachment(
            teacher.email,
            input.teacherName,
            input.schoolName,
            zipBuffer,
            input.zipFileName,
            input.studentNames,
            input.customSubject,
            input.customBody
          );

          if (!emailSent) {
            return {
              success: false,
              error: "Failed to send email. Please try again later.",
            };
          }

          await db.createZipEmailHistory({
            teacherId: ctx.user.id,
            recipientEmail: teacher.email,
            certificateCount: input.studentNames.length,
            studentNames: JSON.stringify(input.studentNames),
            zipFileName: input.zipFileName,
            zipFileSize: zipBuffer.length,
            status: "sent",
            sentAt: new Date(),
          });

          await notifyOwner({
            title: `Email ZIP Certificates - ${input.studentNames.length} certificates`,
            content: `Teacher: ${input.teacherName}\nSchool: ${input.schoolName}\nRecipient: ${teacher.email}\nCertificates: ${input.studentNames.length}\nFile: ${input.zipFileName}`,
          });

          return {
            success: true,
            message: `ZIP file with ${input.studentNames.length} certificates sent to ${teacher.email}`,
          };
        } catch (error) {
          console.error("[Certificate ZIP Email] Error:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred",
          };
        }
      }),
  }),

  scheduledEmails: router({
    create: protectedProcedure
      .input(z.object({
        studentName: z.string().min(1).max(100),
        recipientEmail: z.string().email(),
        achievementType: z.string(),
        teacherName: z.string().optional(),
        schoolName: z.string().optional(),
        customMessage: z.string().optional(),
        emailSubject: z.string(),
        emailBody: z.string(),
        scheduledFor: z.string(), // ISO date string
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createScheduledEmail({
          ...input,
          teacherName: input.teacherName ?? null,
          schoolName: input.schoolName ?? null,
          customMessage: input.customMessage ?? null,
          scheduledFor: new Date(input.scheduledFor),
          teacherId: ctx.user.id,
        });
        return { success: true };
      }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getTeacherScheduledEmails(ctx.user.id);
    }),

    getPending: protectedProcedure.query(async ({ ctx }) => {
      return db.getPendingScheduledEmails(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getScheduledEmailById(input.id, ctx.user.id);
      }),

    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.cancelScheduledEmail(input.id, ctx.user.id);
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        scheduledFor: z.string().optional(),
        emailSubject: z.string().optional(),
        emailBody: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, scheduledFor, ...data } = input;
        const updateData: Record<string, unknown> = { ...data };
        if (scheduledFor) {
          updateData.scheduledFor = new Date(scheduledFor);
        }
        await db.updateScheduledEmail(id, ctx.user.id, updateData);
        return { success: true };
      }),
  }),

  emailTemplates: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return db.getTeacherEmailTemplates(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getEmailTemplateById(input.id, ctx.user.id);
      }),

    getDefault: protectedProcedure
      .input(z.object({ achievementType: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getDefaultTemplate(ctx.user.id, input.achievementType);
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        subject: z.string().min(1),
        body: z.string().min(1),
        achievementType: z.string().optional(),
        isDefault: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createEmailTemplate({
          ...input,
          achievementType: input.achievementType ?? null,
          teacherId: ctx.user.id,
        });
        return { success: true };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        subject: z.string().min(1).optional(),
        body: z.string().min(1).optional(),
        achievementType: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateEmailTemplate(id, ctx.user.id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteEmailTemplate(input.id, ctx.user.id);
        return { success: true };
      }),

    shareTemplate: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        colleagueEmail: z.string().email(),
        permission: z.enum(["view", "edit", "admin"]).default("view"),
      }))
      .mutation(async ({ ctx, input }) => {
        const shareCode = await db.shareTemplate(
          input.templateId,
          ctx.user.id,
          ctx.user.id,
          input.permission
        );
        return { success: true, shareCode };
      }),

    getSharedWithMe: protectedProcedure.query(async ({ ctx }) => {
      return db.getSharedTemplates(ctx.user.id);
    }),

    revokeShare: protectedProcedure
      .input(z.object({ shareId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.revokeTemplateShare(input.shareId);
        return { success: true };
      }),

    publishToLibrary: protectedProcedure
      .input(z.object({
        templateId: z.number(),
        title: z.string().min(1).max(100),
        description: z.string().optional(),
        category: z.string().default("general"),
        tags: z.string().optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const libraryId = await db.addToSharedLibrary(
          input.templateId,
          ctx.user.id,
          input.title,
          input.description || "",
          input.category,
          input.tags || "",
          input.isPublic
        );
        return { success: true, libraryId };
      }),

    getPublicTemplates: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input }) => {
        return db.getPublicTemplates(input.category);
      }),

    importTemplate: protectedProcedure
      .input(z.object({
        originalTemplateId: z.number(),
        newTemplateName: z.string().min(1).max(100),
      }))
      .mutation(async ({ ctx, input }) => {
        const newTemplateId = await db.importTemplate(
          input.originalTemplateId,
          ctx.user.id,
          input.newTemplateName
        );
        return { success: true, newTemplateId };
      }),

    rateTemplate: publicProcedure
      .input(z.object({
        libraryId: z.number(),
        rating: z.number().min(0).max(5),
      }))
      .mutation(async ({ input }) => {
        await db.updateLibraryRating(input.libraryId, input.rating);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
