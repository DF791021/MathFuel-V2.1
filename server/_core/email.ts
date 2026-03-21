import nodemailer from "nodemailer";
import { Resend } from "resend";

// Email transporter (nodemailer for SMTP)
let transporter: nodemailer.Transporter | null = null;

// Resend client for transactional emails
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (resendApiKey) {
  console.log("[Email] Resend configured for transactional emails");
} else if (!process.env.SMTP_HOST) {
  console.log("[Email] Using development mode (Ethereal test account)");
}

export async function getEmailTransporter() {
  if (transporter) {
    return transporter;
  }

  // In development or if no email config is provided, use test account
  if (!process.env.SMTP_HOST) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("[Email] Using Ethereal test account for development");
    return transporter;
  }

  // Production configuration from environment variables
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // Use Resend if configured (preferred for transactional emails)
    if (resend) {
      const result = await resend.emails.send({
        from: "MathFuel <noreply@mathfuel.org>",
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (result.error) {
        console.error("[Email] Resend failed:", result.error);
        return false;
      }

      console.log("[Email] Sent via Resend:", result.data?.id);
      return true;
    }

    // Fallback to nodemailer
    const emailTransporter = await getEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@mathfuel.org",
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || [],
    };

    const info = await emailTransporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== "production" && info.response?.includes("Ethereal")) {
      console.log("[Email] Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    console.log("[Email] Message sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return false;
  }
}

/**
 * Send a branded MathFuel email with consistent styling
 */
export function buildMathFuelEmailHtml(options: {
  heading: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}): string {
  return `
    <div style="font-family: 'Nunito', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🚀 MathFuel</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">${options.heading}</p>
      </div>
      
      <div style="background: #FFFBF5; padding: 30px; border-radius: 0 0 8px 8px;">
        <div style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          ${options.body}
        </div>
        
        ${options.ctaText && options.ctaUrl ? `
        <div style="text-align: center; margin: 25px 0;">
          <a href="${options.ctaUrl}" style="background: #4F46E5; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            ${options.ctaText}
          </a>
        </div>
        ` : ""}
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Best regards,<br>
          <strong>The MathFuel Team</strong>
        </p>
      </div>
    </div>
  `;
}
