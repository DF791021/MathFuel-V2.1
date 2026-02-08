/**
 * Admin Email Templates
 * Transactional, trust-building emails for parents, teachers, and administrators
 */

export interface AdminEmailContext {
  adminName: string;
  schoolName?: string;
  date?: string;
}

/**
 * Account Created - Welcome email for new admin
 */
export function accountCreatedEmail(context: AdminEmailContext) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Welcome to MathFuel</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your account is ready</p>
      </div>
      
      <div style="background: #f8fafc; padding: 40px 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${context.adminName},</p>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #555;">
          Your MathFuel administrator account has been created successfully. You now have access to manage your school's math learning platform.
        </p>
        
        <div style="background: white; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">What you can do:</h3>
          <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #555;">
            <li style="margin: 8px 0;">Manage student accounts and classes</li>
            <li style="margin: 8px 0;">View learning analytics and progress reports</li>
            <li style="margin: 8px 0;">Configure payment and subscription settings</li>
            <li style="margin: 8px 0;">Access system notifications and alerts</li>
          </ul>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #555;">
          If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.
        </p>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Best regards,<br>
          <strong>MathFuel Team</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Payment Confirmation - Successful payment received
 */
export function paymentConfirmationEmail(context: AdminEmailContext & { amount: string; orderId: string; date: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">✓ Payment Confirmed</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your payment has been received</p>
      </div>
      
      <div style="background: #f0fdf4; padding: 40px 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${context.adminName},</p>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #555;">
          Your payment has been successfully processed. Here are the details:
        </p>
        
        <div style="background: white; border: 1px solid #d1fae5; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; font-size: 14px; color: #555;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600; color: #059669;">Order ID:</td>
              <td style="padding: 10px 0; text-align: right;">${context.orderId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 10px 0; font-weight: 600; color: #059669;">Amount:</td>
              <td style="padding: 10px 0; text-align: right; font-size: 16px; font-weight: 700;">${context.amount}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; font-weight: 600; color: #059669;">Date:</td>
              <td style="padding: 10px 0; text-align: right;">${context.date}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #047857; font-size: 14px;">
            Your subscription is now active. Students can start learning immediately.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Best regards,<br>
          <strong>MathFuel Team</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Payment Failed - Payment could not be processed
 */
export function paymentFailedEmail(context: AdminEmailContext & { reason: string; orderId: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Payment Issue</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">We couldn't process your payment</p>
      </div>
      
      <div style="background: #fef2f2; padding: 40px 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${context.adminName},</p>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #555;">
          We attempted to process your payment but encountered an issue. Here's what happened:
        </p>
        
        <div style="background: white; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #555;">
            <strong>Reason:</strong> ${context.reason}
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: #555;">
            <strong>Order ID:</strong> ${context.orderId}
          </p>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;">
            <strong>Next steps:</strong> Please check your payment method and try again. If the issue persists, contact our support team.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Best regards,<br>
          <strong>MathFuel Team</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Subscription Renewal - Subscription will renew soon
 */
export function subscriptionRenewalEmail(context: AdminEmailContext & { renewalDate: string; amount: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Subscription Renewal</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Your subscription will renew soon</p>
      </div>
      
      <div style="background: #eff6ff; padding: 40px 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${context.adminName},</p>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #555;">
          This is a friendly reminder that your MathFuel subscription will renew on <strong>${context.renewalDate}</strong>.
        </p>
        
        <div style="background: white; border: 1px solid #bfdbfe; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <table style="width: 100%; font-size: 14px; color: #555;">
            <tr>
              <td style="padding: 10px 0; font-weight: 600; color: #2563eb;">Renewal Amount:</td>
              <td style="padding: 10px 0; text-align: right; font-size: 16px; font-weight: 700;">${context.amount}</td>
            </tr>
          </table>
        </div>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #555;">
          No action is needed. Your subscription will automatically renew using your saved payment method. If you need to make any changes, please log in to your account.
        </p>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Best regards,<br>
          <strong>MathFuel Team</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * System Alert - Critical system issue or maintenance
 */
export function systemAlertEmail(context: AdminEmailContext & { title: string; message: string; severity: "info" | "warning" | "critical" }) {
  const colors = {
    info: { bg: "#dbeafe", border: "#3b82f6", text: "#1e40af" },
    warning: { bg: "#fef3c7", border: "#f59e0b", text: "#92400e" },
    critical: { bg: "#fee2e2", border: "#ef4444", text: "#991b1b" },
  };

  const color = colors[context.severity];

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, ${color.border} 0%, ${color.border}cc 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">System Alert</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">${context.title}</p>
      </div>
      
      <div style="background: ${color.bg}; padding: 40px 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${context.adminName},</p>
        
        <div style="background: white; border-left: 4px solid ${color.border}; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #555;">
            ${context.message}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Best regards,<br>
          <strong>MathFuel Team</strong>
        </p>
      </div>
    </div>
  `;
}

/**
 * Platform Update - New features or improvements
 */
export function platformUpdateEmail(context: AdminEmailContext & { title: string; description: string; features: string[] }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">✨ Platform Update</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">${context.title}</p>
      </div>
      
      <div style="background: #faf5ff; padding: 40px 20px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${context.adminName},</p>
        
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px; color: #555;">
          ${context.description}
        </p>
        
        <div style="background: white; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #7c3aed; font-size: 16px;">What's new:</h3>
          <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; color: #555;">
            ${context.features.map((feature) => `<li style="margin: 8px 0;">${feature}</li>`).join("")}
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Best regards,<br>
          <strong>MathFuel Team</strong>
        </p>
      </div>
    </div>
  `;
}
