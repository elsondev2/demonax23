import nodemailer from "nodemailer";
import { ENV } from "./env.js";

// Create reusable transporter
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  // Configure based on your email service
  transporter = nodemailer.createTransport({
    host: ENV.SMTP_HOST || "smtp.gmail.com",
    port: ENV.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: ENV.SMTP_USER, // Your email
      pass: ENV.SMTP_PASS, // Your password or app password
    },
  });

  return transporter;
}

/**
 * Send email using Nodemailer
 */
export async function sendEmail({ to, subject, html }) {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"${ENV.EMAIL_FROM_NAME || 'Your App'}" <${ENV.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw new Error("Failed to send email");
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
