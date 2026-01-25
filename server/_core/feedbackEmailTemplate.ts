/**
 * Email templates for feedback notifications
 */

export interface FeedbackNotificationData {
  adminName: string;
  adminEmail: string;
  schoolName: string;
  feedbackType: string;
  feedbackTitle: string;
  feedbackDescription: string;
  rating?: number;
  submittedBy: string;
  submittedAt: string;
  dashboardUrl: string;
  isLowRating?: boolean;
}

export function generateFeedbackNotificationEmail(data: FeedbackNotificationData): string {
  const ratingColor = data.rating && data.rating <= 2 ? '#dc2626' : '#2563eb';
  const ratingBg = data.rating && data.rating <= 2 ? '#fee2e2' : '#eff6ff';
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5A3C 0%, #A0683C 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .section { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
          .feedback-box { background: white; border-left: 4px solid ${ratingColor}; padding: 15px; margin: 15px 0; border-radius: 4px; }
          .feedback-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
          .feedback-description { font-size: 14px; color: #4b5563; line-height: 1.6; }
          .rating-badge { display: inline-block; background: ${ratingBg}; color: ${ratingColor}; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 13px; margin-top: 10px; }
          .meta { font-size: 13px; color: #6b7280; margin-top: 10px; }
          .cta-button { display: inline-block; background: #8B5A3C; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 15px; }
          .footer { text-align: center; font-size: 12px; color: #9ca3af; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
          .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin-bottom: 20px; font-size: 13px; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Feedback Received</h1>
          </div>
          
          <div class="content">
            ${data.isLowRating ? '<div class="alert">⚠️ <strong>Low Rating Alert:</strong> This feedback includes a low rating (1-2 stars) and may require priority attention.</div>' : ''}
            
            <div class="section">
              <div class="section-title">Feedback Details</div>
              <div class="feedback-box">
                <div class="feedback-title">${escapeHtml(data.feedbackTitle)}</div>
                <div class="feedback-description">${escapeHtml(data.feedbackDescription)}</div>
                ${data.rating ? `<div class="rating-badge">Rating: ${data.rating}/5 ⭐</div>` : ''}
                <div class="meta">
                  <strong>Type:</strong> ${escapeHtml(data.feedbackType)}<br>
                  <strong>School:</strong> ${escapeHtml(data.schoolName)}<br>
                  <strong>Submitted by:</strong> ${escapeHtml(data.submittedBy)}<br>
                  <strong>Date:</strong> ${data.submittedAt}
                </div>
              </div>
            </div>
            
            <div class="section">
              <p>Review and respond to this feedback in your admin dashboard:</p>
              <a href="${data.dashboardUrl}" class="cta-button">View in Dashboard</a>
            </div>
            
            <div class="section">
              <p style="font-size: 13px; color: #6b7280;">
                This is an automated notification from Wisconsin Nutrition Explorer. Please do not reply to this email.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>Wisconsin Nutrition Explorer • Trial Management System</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function generateFeedbackNotificationEmailText(data: FeedbackNotificationData): string {
  return `
NEW FEEDBACK RECEIVED

Feedback Type: ${data.feedbackType}
Title: ${data.feedbackTitle}
Description: ${data.feedbackDescription}
${data.rating ? `Rating: ${data.rating}/5` : ''}

School: ${data.schoolName}
Submitted by: ${data.submittedBy}
Date: ${data.submittedAt}

${data.isLowRating ? 'LOW RATING ALERT: This feedback includes a low rating (1-2 stars) and may require priority attention.' : ''}

View in Dashboard: ${data.dashboardUrl}

---
This is an automated notification from Wisconsin Nutrition Explorer.
  `;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
