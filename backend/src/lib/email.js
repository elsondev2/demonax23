import nodemailer from "nodemailer";
import { ENV } from "./env.js";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

// Initialize MailerSend
let mailerSend = null;
if (ENV.MAILERSEND_API_KEY) {
  mailerSend = new MailerSend({
    apiKey: ENV.MAILERSEND_API_KEY,
  });
  console.log("✅ MailerSend email service initialized");
}

// Create reusable transporter for SMTP fallback
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Validate required environment variables
  if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
    console.error("❌ SMTP credentials missing! Check SMTP_USER and SMTP_PASS in environment variables.");
    throw new Error("Email configuration incomplete");
  }

  // Configure based on your email service
  transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(ENV.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: ENV.SMTP_USER, // Your email
      pass: ENV.SMTP_PASS, // Your password or app password
    },
    // Add timeout and connection options for production
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  console.log(`✅ Email transporter configured: ${ENV.SMTP_USER} via ${ENV.SMTP_HOST}:${ENV.SMTP_PORT}`);

  return transporter;
}

/**
 * Send email using MailerSend (preferred) or Nodemailer (fallback)
 */
export async function sendEmail({ to, subject, html }) {
  console.log(`📧 Attempting to send email to: ${to}`);
  console.log(`📧 Subject: ${subject}`);

  // Try MailerSend first (works on Render)
  if (mailerSend) {
    try {
      console.log("📧 Using MailerSend email service...");

      const sentFrom = new Sender(
        ENV.EMAIL_FROM || "info@test-ywj2lpn1dvqg7oqz.mlsender.net",
        ENV.EMAIL_FROM_NAME || "de_monax"
      );

      const recipients = [new Recipient(to)];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(subject)
        .setHtml(html);

      const response = await mailerSend.email.send(emailParams);

      console.log(`✅ Email sent successfully via MailerSend`);
      return { success: true, messageId: response.body?.id || 'sent', provider: 'mailersend' };
    } catch (mailerSendError) {
      console.error("❌ MailerSend failed:", mailerSendError.message);
      console.error("❌ Error details:", mailerSendError);
      // Fall through to SMTP
    }
  }

  // Fallback to SMTP (Nodemailer)
  try {
    console.log("📧 Using SMTP email service...");
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"${ENV.EMAIL_FROM_NAME || 'Your App'}" <${ENV.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully via SMTP: ${info.messageId}`);
    console.log(`✅ Response: ${info.response}`);
    return { success: true, messageId: info.messageId, provider: 'smtp' };
  } catch (error) {
    console.error("❌ Failed to send email via SMTP:", error.message);
    console.error("❌ Error details:", {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig() {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("✅ Email configuration is valid");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error.message);
    return false;
  }
}
