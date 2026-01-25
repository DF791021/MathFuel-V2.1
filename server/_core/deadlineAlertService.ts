import { sendEmail } from "./email";
import { recordAlertHistory, updateGoalAlertStatus } from "../db";

export interface DeadlineAlertData {
  studentName: string;
  studentEmail: string;
  goalName: string;
  daysUntilDeadline: number;
  goalDescription?: string;
  targetValue?: number;
  currentProgress?: number;
}

/**
 * Generate HTML email template for deadline alert
 */
export function generateDeadlineAlertEmailHtml(data: DeadlineAlertData): string {
  const progressPercentage = data.currentProgress && data.targetValue 
    ? Math.round((data.currentProgress / data.targetValue) * 100)
    : 0;

  const urgencyMessage = data.daysUntilDeadline === 1
    ? "Your goal deadline is <strong>tomorrow</strong>!"
    : data.daysUntilDeadline <= 3
    ? `Your goal deadline is in <strong>${data.daysUntilDeadline} days</strong>.`
    : `Your goal deadline is in <strong>${data.daysUntilDeadline} days</strong>.`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .goal-card { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
          .progress-bar { background: #e0e0e0; height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
          .progress-fill { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${progressPercentage}%; transition: width 0.3s ease; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          .urgency { color: #d32f2f; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Goal Deadline Reminder</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.studentName}</strong>,</p>
            
            <p>This is a friendly reminder about your goal progress:</p>
            
            <div class="goal-card">
              <h3>${data.goalName}</h3>
              ${data.goalDescription ? `<p>${data.goalDescription}</p>` : ''}
              
              ${data.currentProgress !== undefined && data.targetValue ? `
                <div>
                  <p>Current Progress: <strong>${data.currentProgress}/${data.targetValue}</strong> (${progressPercentage}%)</p>
                  <div class="progress-bar">
                    <div class="progress-fill"></div>
                  </div>
                </div>
              ` : ''}
              
              <p class="urgency">${urgencyMessage}</p>
            </div>
            
            <p>You're doing great! Keep pushing toward your goal. Every step counts!</p>
            
            <a href="#" class="cta-button">View Your Goal</a>
            
            <p style="margin-top: 30px; color: #666; font-size: 14px;">
              If you've already completed this goal or want to adjust your deadline, you can update it in your student portal.
            </p>
          </div>
          <div class="footer">
            <p>Wisconsin Nutrition Explorer - Learning Through Nutrition Adventures</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text email for deadline alert
 */
export function generateDeadlineAlertEmailText(data: DeadlineAlertData): string {
  const progressPercentage = data.currentProgress && data.targetValue 
    ? Math.round((data.currentProgress / data.targetValue) * 100)
    : 0;

  const urgencyMessage = data.daysUntilDeadline === 1
    ? "Your goal deadline is TOMORROW!"
    : data.daysUntilDeadline <= 3
    ? `Your goal deadline is in ${data.daysUntilDeadline} days.`
    : `Your goal deadline is in ${data.daysUntilDeadline} days.`;

  return `
Goal Deadline Reminder

Hi ${data.studentName},

This is a friendly reminder about your goal progress:

Goal: ${data.goalName}
${data.goalDescription ? `Description: ${data.goalDescription}\n` : ''}
${data.currentProgress !== undefined && data.targetValue ? `Current Progress: ${data.currentProgress}/${data.targetValue} (${progressPercentage}%)\n` : ''}
${urgencyMessage}

You're doing great! Keep pushing toward your goal. Every step counts!

If you've already completed this goal or want to adjust your deadline, you can update it in your student portal.

---
Wisconsin Nutrition Explorer - Learning Through Nutrition Adventures
  `;
}

/**
 * Send deadline alert email to student
 */
export async function sendDeadlineAlert(
  alertId: number,
  data: DeadlineAlertData
): Promise<{ success: boolean; error?: string }> {
  try {
    const htmlContent = generateDeadlineAlertEmailHtml(data);
    const textContent = generateDeadlineAlertEmailText(data);

    const subject = data.daysUntilDeadline === 1
      ? `⏰ Goal Deadline Tomorrow: ${data.goalName}`
      : `⏰ Goal Deadline Reminder: ${data.goalName} (${data.daysUntilDeadline} days)`;

    const result = await sendEmail({
      to: data.studentEmail,
      subject,
      html: htmlContent,
    });

    if (result) {
      // Record in alert history
      await recordAlertHistory({
        playerId: 0, // Will be set by caller
        goalId: 0, // Will be set by caller
        goalName: data.goalName,
        daysUntilDeadline: data.daysUntilDeadline,
        emailSent: true,
        emailAddress: data.studentEmail,
        status: "sent",
      });

      // Update alert status to sent
      await updateGoalAlertStatus(alertId, "sent");

      return { success: true };
    } else {
      return { success: false, error: "Failed to send email" };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[DeadlineAlertService] Error sending deadline alert:", errorMessage);
    return { success: false, error: String(errorMessage) };
  }
}

/**
 * Calculate days until deadline
 */
export function calculateDaysUntilDeadline(dueDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const deadline = new Date(dueDate);
  deadline.setHours(0, 0, 0, 0);
  
  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Check if alert should be sent based on reminder preferences
 */
export function shouldSendAlert(
  daysUntilDeadline: number,
  reminderDaysBefore: number,
  lastAlertSentDaysAgo?: number
): boolean {
  // Send if exactly at reminder day
  if (daysUntilDeadline === reminderDaysBefore) {
    return true;
  }

  // For urgent reminders (1-2 days), send even if already sent
  if (daysUntilDeadline <= 2 && (!lastAlertSentDaysAgo || lastAlertSentDaysAgo > 1)) {
    return true;
  }

  return false;
}
