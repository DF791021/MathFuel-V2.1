import { notifyOwner } from "./notification";

export interface FeedbackNotificationData {
  schoolName: string;
  feedbackType: string;
  feedbackTitle: string;
  feedbackDescription: string;
  rating?: number;
  submittedBy: string;
  submittedAt: string;
  isLowRating?: boolean;
  dashboardUrl: string;
}

/**
 * Send admin notification for new feedback submission
 * Uses Manus notification API to alert project owner
 */
export async function sendFeedbackNotification(
  data: FeedbackNotificationData
): Promise<boolean> {
  try {
    const isLowRating = data.rating && data.rating <= 2;
    
    // Build notification title
    const titlePrefix = isLowRating ? "🚨 LOW RATING ALERT" : "📝 New Feedback";
    const title = `${titlePrefix}: ${data.feedbackType.replace(/_/g, " ")} from ${data.schoolName}`;

    // Build notification content
    const ratingLine = data.rating ? `\n⭐ Rating: ${data.rating}/5` : "";
    const content = `
New feedback submission received:

Title: ${data.feedbackTitle}
Type: ${data.feedbackType.replace(/_/g, " ")}
Category: ${data.feedbackDescription.substring(0, 100)}...${ratingLine}

School: ${data.schoolName}
Submitted by: ${data.submittedBy}
Date: ${data.submittedAt}

${isLowRating ? "⚠️ This is a LOW RATING submission and may require priority attention." : ""}

View in Dashboard: ${data.dashboardUrl}
    `.trim();

    // Send notification via Manus API
    const success = await notifyOwner({
      title,
      content,
    });

    if (success) {
      console.log(`[Feedback Notification] Successfully sent notification for feedback: ${data.feedbackTitle}`);
    } else {
      console.warn(`[Feedback Notification] Failed to send notification (service unavailable)`);
    }

    return success;
  } catch (error) {
    console.error("[Feedback Notification] Error sending feedback notification:", error);
    return false;
  }
}

/**
 * Send batch notification for high-priority feedback
 */
export async function sendHighPriorityFeedbackAlert(
  feedbackCount: number,
  lowRatingCount: number,
  bugCount: number,
  dashboardUrl: string
): Promise<boolean> {
  try {
    const title = `🚨 High-Priority Feedback Alert: ${lowRatingCount} Low Ratings + ${bugCount} Bugs`;
    
    const content = `
Your feedback dashboard has high-priority items requiring attention:

📊 Summary:
  • Low Ratings (1-2 stars): ${lowRatingCount}
  • Bug Reports: ${bugCount}
  • Total Feedback: ${feedbackCount}

These items may impact user satisfaction and product quality. Please review them in your dashboard.

View Dashboard: ${dashboardUrl}
    `.trim();

    const success = await notifyOwner({
      title,
      content,
    });

    if (success) {
      console.log(`[Feedback Notification] Successfully sent high-priority alert`);
    } else {
      console.warn(`[Feedback Notification] Failed to send high-priority alert`);
    }

    return success;
  } catch (error) {
    console.error("[Feedback Notification] Error sending high-priority alert:", error);
    return false;
  }
}
