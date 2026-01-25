/**
 * Trial Confirmation Email Templates
 * Generates professional HTML emails for trial users
 */

export interface TrialEmailData {
  schoolName: string;
  contactName: string;
  schoolCode: string;
  adminEmail: string;
  tempPassword: string;
  trialEndDate: string;
  loginUrl: string;
  supportEmail?: string;
}

/**
 * Generate trial confirmation email HTML
 */
export function generateTrialConfirmationEmail(data: TrialEmailData): string {
  const trialDaysRemaining = Math.ceil(
    (new Date(data.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Wisconsin Nutrition Explorer Trial</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #2d5016 0%, #3d6b1f 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.95;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
      color: #2d5016;
      font-weight: 600;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 700;
      color: #2d5016;
      margin-bottom: 15px;
      border-bottom: 2px solid #e8f0e0;
      padding-bottom: 10px;
    }
    
    .credentials-box {
      background-color: #f9faf8;
      border-left: 4px solid #2d5016;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }
    
    .credential-item {
      margin-bottom: 15px;
    }
    
    .credential-label {
      font-size: 12px;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }
    
    .credential-value {
      font-size: 16px;
      color: #2d5016;
      font-weight: 700;
      word-break: break-all;
    }
    
    .trial-info {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px 20px;
      margin-bottom: 20px;
      border-radius: 4px;
    }
    
    .trial-info p {
      font-size: 14px;
      color: #856404;
      margin: 0;
    }
    
    .quick-start {
      background-color: #e8f0e0;
      padding: 20px;
      border-radius: 4px;
    }
    
    .quick-start ol {
      margin-left: 20px;
      margin-top: 10px;
    }
    
    .quick-start li {
      margin-bottom: 12px;
      font-size: 14px;
      color: #333;
    }
    
    .quick-start strong {
      color: #2d5016;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #2d5016;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      font-size: 16px;
      margin-right: 10px;
      margin-bottom: 10px;
      transition: background-color 0.3s ease;
    }
    
    .cta-button:hover {
      background-color: #1f3810;
    }
    
    .cta-button.secondary {
      background-color: #6c757d;
    }
    
    .cta-button.secondary:hover {
      background-color: #5a6268;
    }
    
    .button-group {
      margin: 25px 0;
    }
    
    .support-section {
      background-color: #f9faf8;
      padding: 20px;
      border-radius: 4px;
      margin-top: 25px;
    }
    
    .support-section h4 {
      color: #2d5016;
      font-size: 14px;
      margin-bottom: 10px;
    }
    
    .support-section p {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }
    
    .footer {
      background-color: #f5f5f5;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #999;
    }
    
    .footer p {
      margin-bottom: 8px;
    }
    
    .footer a {
      color: #2d5016;
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    .divider {
      height: 1px;
      background-color: #e0e0e0;
      margin: 25px 0;
    }
    
    @media (max-width: 600px) {
      .email-container {
        border-radius: 0;
      }
      
      .header {
        padding: 30px 20px;
      }
      
      .header h1 {
        font-size: 24px;
      }
      
      .content {
        padding: 25px 20px;
      }
      
      .cta-button {
        display: block;
        text-align: center;
        margin-right: 0;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>🎉 Welcome to Wisconsin Nutrition Explorer!</h1>
      <p>Your 30-day free trial is ready to begin</p>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- Greeting -->
      <div class="greeting">
        Hello ${data.contactName},
      </div>
      
      <p>
        Thank you for requesting a trial of Wisconsin Nutrition Explorer! We're excited to help your school engage students in nutrition education through interactive games and learning activities.
      </p>
      
      <div class="divider"></div>
      
      <!-- Login Credentials -->
      <div class="section">
        <div class="section-title">📋 Your Login Credentials</div>
        
        <div class="credentials-box">
          <div class="credential-item">
            <div class="credential-label">School Code</div>
            <div class="credential-value">${data.schoolCode}</div>
          </div>
          
          <div class="credential-item">
            <div class="credential-label">Admin Email</div>
            <div class="credential-value">${data.adminEmail}</div>
          </div>
          
          <div class="credential-item">
            <div class="credential-label">Temporary Password</div>
            <div class="credential-value">${data.tempPassword}</div>
          </div>
        </div>
        
        <p style="font-size: 13px; color: #666; margin-top: 10px;">
          <strong>⚠️ Important:</strong> Please change your password immediately after first login for security.
        </p>
      </div>
      
      <!-- Trial Duration -->
      <div class="trial-info">
        <p>
          <strong>✓ Trial Duration:</strong> Your trial account is active for ${trialDaysRemaining} days (expires ${data.trialEndDate})
        </p>
      </div>
      
      <!-- Quick Start Guide -->
      <div class="section">
        <div class="section-title">🚀 Quick Start Guide (5 Minutes)</div>
        
        <div class="quick-start">
          <ol>
            <li><strong>Log in</strong> using your credentials above at ${data.loginUrl}</li>
            <li><strong>Create your first class</strong> and give it a name (e.g., "Grade 4 Nutrition")</li>
            <li><strong>Add students</strong> by entering their names or uploading a class list</li>
            <li><strong>Start a game</strong> and watch students engage with nutrition challenges</li>
            <li><strong>View analytics</strong> to see student learning progress and engagement</li>
          </ol>
        </div>
      </div>
      
      <!-- Call-to-Action -->
      <div class="button-group">
        <a href="${data.loginUrl}" class="cta-button">🔐 Log In Now</a>
        <a href="https://wisconsin-nutrition-explorer.com/quick-start" class="cta-button secondary">📖 View Full Guide</a>
      </div>
      
      <!-- What's Included -->
      <div class="section">
        <div class="section-title">✨ What's Included in Your Trial</div>
        
        <ul style="margin-left: 20px; font-size: 14px; color: #333;">
          <li style="margin-bottom: 10px;"><strong>Wisconsin Nutrition Game:</strong> 60+ challenge cards covering nutrition topics</li>
          <li style="margin-bottom: 10px;"><strong>Nutrition Roulette:</strong> Interactive multiplayer game with real-time scoring</li>
          <li style="margin-bottom: 10px;"><strong>Teacher Analytics:</strong> Detailed reports on student learning and engagement</li>
          <li style="margin-bottom: 10px;"><strong>Certificate Generation:</strong> Create and email student achievement certificates</li>
          <li style="margin-bottom: 10px;"><strong>Success Stories:</strong> Showcase student achievements with customizable reports</li>
          <li style="margin-bottom: 10px;"><strong>AI Assistant:</strong> Get lesson ideas and teaching resources instantly</li>
          <li style="margin-bottom: 10px;"><strong>Unlimited Classes & Students:</strong> Full access during trial period</li>
        </ul>
      </div>
      
      <!-- Support Section -->
      <div class="support-section">
        <h4>❓ Need Help?</h4>
        <p>
          <strong>Video Tutorials:</strong> Check out our <a href="https://wisconsin-nutrition-explorer.com/tutorials" style="color: #2d5016; text-decoration: none;">quick tutorial videos</a> (5-10 minutes each)
        </p>
        <p>
          <strong>User Manual:</strong> Download our <a href="https://wisconsin-nutrition-explorer.com/manual" style="color: #2d5016; text-decoration: none;">comprehensive guide</a> for detailed instructions
        </p>
        <p>
          <strong>Support Email:</strong> ${data.supportEmail || 'support@wisconsin-nutrition-explorer.com'}
        </p>
      </div>
      
      <div class="divider"></div>
      
      <!-- Closing -->
      <p style="margin-top: 20px;">
        We're confident you'll love Wisconsin Nutrition Explorer. If you have any questions or feedback during your trial, please don't hesitate to reach out.
      </p>
      
      <p style="margin-top: 15px;">
        Happy exploring!<br>
        <strong>The Wisconsin Nutrition Explorer Team</strong>
      </p>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <p>
        <strong>Wisconsin Nutrition Explorer</strong> | Free Trial Account
      </p>
      <p>
        This is an automated email. Please do not reply directly to this message.
      </p>
      <p>
        <a href="https://wisconsin-nutrition-explorer.com/privacy">Privacy Policy</a> | 
        <a href="https://wisconsin-nutrition-explorer.com/terms">Terms of Service</a>
      </p>
      <p style="margin-top: 15px; color: #ccc;">
        © 2026 Wisconsin Nutrition Explorer. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text version of trial confirmation email
 */
export function generateTrialConfirmationEmailText(data: TrialEmailData): string {
  const trialDaysRemaining = Math.ceil(
    (new Date(data.trialEndDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return `
WELCOME TO WISCONSIN NUTRITION EXPLORER!

Hello ${data.contactName},

Thank you for requesting a trial of Wisconsin Nutrition Explorer! We're excited to help your school engage students in nutrition education through interactive games and learning activities.

YOUR LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

School Code: ${data.schoolCode}
Admin Email: ${data.adminEmail}
Temporary Password: ${data.tempPassword}

⚠️  IMPORTANT: Please change your password immediately after first login for security.

TRIAL DURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your trial account is active for ${trialDaysRemaining} days (expires ${data.trialEndDate})

QUICK START GUIDE (5 MINUTES)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Log in using your credentials above at ${data.loginUrl}
2. Create your first class and give it a name (e.g., "Grade 4 Nutrition")
3. Add students by entering their names or uploading a class list
4. Start a game and watch students engage with nutrition challenges
5. View analytics to see student learning progress and engagement

WHAT'S INCLUDED IN YOUR TRIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Wisconsin Nutrition Game: 60+ challenge cards covering nutrition topics
✓ Nutrition Roulette: Interactive multiplayer game with real-time scoring
✓ Teacher Analytics: Detailed reports on student learning and engagement
✓ Certificate Generation: Create and email student achievement certificates
✓ Success Stories: Showcase student achievements with customizable reports
✓ AI Assistant: Get lesson ideas and teaching resources instantly
✓ Unlimited Classes & Students: Full access during trial period

NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Video Tutorials: https://wisconsin-nutrition-explorer.com/tutorials
User Manual: https://wisconsin-nutrition-explorer.com/manual
Support Email: ${data.supportEmail || 'support@wisconsin-nutrition-explorer.com'}

We're confident you'll love Wisconsin Nutrition Explorer. If you have any questions or feedback during your trial, please don't hesitate to reach out.

Happy exploring!

The Wisconsin Nutrition Explorer Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated email. Please do not reply directly to this message.

Privacy Policy: https://wisconsin-nutrition-explorer.com/privacy
Terms of Service: https://wisconsin-nutrition-explorer.com/terms

© 2026 Wisconsin Nutrition Explorer. All rights reserved.
  `;
}

/**
 * Generate trial expiration reminder email
 */
export function generateTrialExpirationReminderEmail(data: TrialEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Wisconsin Nutrition Explorer Trial Expires Soon</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #d9534f 0%, #c9302c 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: 700;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .section {
      margin-bottom: 25px;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #2d5016;
      color: white;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      font-size: 16px;
      margin-top: 15px;
    }
    
    .cta-button:hover {
      background-color: #1f3810;
    }
    
    .footer {
      background-color: #f5f5f5;
      padding: 25px 30px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>⏰ Your Trial Expires Soon!</h1>
      <p>Expires on ${data.trialEndDate}</p>
    </div>
    
    <div class="content">
      <p>Hi ${data.contactName},</p>
      
      <p>
        Your Wisconsin Nutrition Explorer trial account is set to expire on <strong>${data.trialEndDate}</strong>. 
        If you'd like to continue using the platform, please reach out to our team to discuss a subscription plan that works for your school.
      </p>
      
      <div class="section">
        <h3>Why Choose Wisconsin Nutrition Explorer?</h3>
        <ul style="margin-left: 20px; margin-top: 10px;">
          <li style="margin-bottom: 10px;">Proven engagement: Students spend 40% more time on nutrition learning</li>
          <li style="margin-bottom: 10px;">Real results: Teachers report 35% improvement in student understanding</li>
          <li style="margin-bottom: 10px;">Easy to use: No training required, works with any device</li>
          <li style="margin-bottom: 10px;">Comprehensive: Games, analytics, certificates, and AI support included</li>
        </ul>
      </div>
      
      <p>
        <a href="https://wisconsin-nutrition-explorer.com/pricing" class="cta-button">View Pricing Plans</a>
      </p>
      
      <p style="margin-top: 25px;">
        Questions? Our team is here to help!<br>
        Email: support@wisconsin-nutrition-explorer.com
      </p>
    </div>
    
    <div class="footer">
      <p>© 2026 Wisconsin Nutrition Explorer. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}
