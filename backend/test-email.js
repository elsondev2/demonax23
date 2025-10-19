import { sendEmail } from "./src/lib/email.js";
import "dotenv/config";

/**
 * Test script to verify email configuration
 * Run with: node backend/test-email.js
 */

async function testEmail() {
  console.log("🧪 Testing email configuration...\n");

  // Check which email service is configured
  if (process.env.RESEND_API_KEY) {
    console.log("✅ Resend API key found");
    console.log(`   Using: ${process.env.EMAIL_FROM || 'onboarding@resend.dev'}\n`);
  } else if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log("✅ SMTP credentials found");
    console.log(`   Using: ${process.env.SMTP_USER}\n`);
  } else {
    console.error("❌ No email configuration found!");
    console.error("   Add RESEND_API_KEY or SMTP credentials to .env");
    process.exit(1);
  }

  // Send a test email
  console.log("📧 Sending test email...");
  const testRecipient = process.env.SMTP_USER || process.env.EMAIL_FROM || "test@example.com";
  
  try {
    const result = await sendEmail({
      to: testRecipient,
      subject: "Test Email - de_monax",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #10b981;">✅ Email Test Successful!</h1>
          <p>If you're reading this, your email configuration is working correctly!</p>
          <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
          <p><strong>Provider:</strong> ${result.provider || 'unknown'}</p>
          <p><strong>Message ID:</strong> ${result.messageId || 'N/A'}</p>
        </div>
      `,
    });
    
    console.log(`\n✅ Test email sent successfully to ${testRecipient}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log("\n🎉 All tests passed! Email is configured correctly.");
  } catch (error) {
    console.error("\n❌ Failed to send test email:", error.message);
    console.error("\nTroubleshooting:");
    console.error("1. Check your environment variables");
    console.error("2. If using Resend, verify API key is correct");
    console.error("3. If using SMTP, check credentials and network access");
    process.exit(1);
  }
}

testEmail();
