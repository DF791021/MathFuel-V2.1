import nodemailer from "nodemailer";
import { Resend } from "resend";
import { ENV } from "./env";

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
    // Create a test account for development
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
        from: "MathFuel <noreply@mathfuel.io>",
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

    // Fallback to nodemailer (for backward compatibility)
    const transporter = await getEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || "noreply@wisconsinfoodexplorer.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);

    // In development with Ethereal, log the preview URL
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

export async function sendEmailWithZipAttachment(
  recipientEmail: string,
  teacherName: string,
  schoolName: string,
  zipBuffer: Buffer,
  zipFileName: string,
  studentNames: string[],
  customSubject?: string,
  customBody?: string
): Promise<boolean> {
  const studentList = studentNames.slice(0, 5).join(", ") + (studentNames.length > 5 ? `, and ${studentNames.length - 5} more` : "");

  // Function to substitute variables in custom text
  const substituteVariables = (text: string): string => {
    return text
      .replace(/{teacher_name}/g, teacherName)
      .replace(/{school_name}/g, schoolName)
      .replace(/{student_count}/g, studentNames.length.toString())
      .replace(/{date}/g, new Date().toLocaleDateString())
      .replace(/\n/g, "<br>");
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎓 Wisconsin Nutrition Explorer</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Certificate Batch Download</p>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
          Dear <strong>${teacherName}</strong>,
        </p>
        
        ${customBody ? `<div style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 20px;">${substituteVariables(customBody)}</div>` : `
        <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          Your bulk certificate batch is ready! We've generated ${studentNames.length} certificates for your students at <strong>${schoolName}</strong>.
        </p>
        
        <div style="background: white; border: 2px solid #2E7D32; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2E7D32;">📦 Batch Details</h3>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
              <strong>Students:</strong> ${studentNames.length}
            </li>
            <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
              <strong>File:</strong> ${zipFileName}
            </li>
            <li style="padding: 8px 0;">
              <strong>Students included:</strong> ${studentList}
            </li>
          </ul>
        </div>
        
        <p style="font-size: 15px; color: #555; line-height: 1.6; margin-bottom: 20px;">
          All certificates are included in the attached ZIP file. Each certificate is a high-resolution PNG image ready for printing or digital sharing.
        </p>
        
        <div style="background: #e8f5e9; border-left: 4px solid #2E7D32; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #1B5E20; font-size: 14px;">
            <strong>💡 Tip:</strong> You can print all certificates at once or share them individually with students and parents.
          </p>
        </div>
        `}
        
        <p style="font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          Best regards,<br>
          <strong>Wisconsin Nutrition Explorer Team</strong>
        </p>
      </div>
    </div>
  `;

  // Use custom subject if provided, otherwise use default
  const emailSubject = customSubject ? substituteVariables(customSubject) : `🎓 Your ${studentNames.length} Wisconsin Nutrition Explorer Certificates - ${schoolName}`;

  return sendEmail({
    to: recipientEmail,
    subject: emailSubject,
    html,
    attachments: [
      {
        filename: zipFileName,
        content: zipBuffer,
        contentType: "application/zip",
      },
    ],
  });
}
