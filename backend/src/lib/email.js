import nodemailer from "nodemailer";
import { ENV } from "./env.js";

// Create reusable transporter
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
 * Send email using Nodemailer
 */
export async function sendEmail({ to, subject, html }) {
  try {
    const transporter = getTransporter();

    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);

    const info = await transporter.sendMail({
      from: `"${ENV.EMAIL_FROM_NAME || 'Your App'}" <${ENV.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully: ${info.messageId}`);
    console.log(`✅ Response: ${info.response}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
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
