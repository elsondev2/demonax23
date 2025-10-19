import { testEmailConfig, sendEmail } from "./src/lib/email.js";
import "dotenv/config";

/**
 * Test script to verify email configuration
 * Run with: node backend/test-email.js
 */

async function testEmail() {
  console.log("🧪 Testing email configuration...\n");

  // Test 1: Verify SMTP configuration
  console.log("Test 1: Verifying SMTP configuration...");
  const isValid = await testEmailConfig();
  
  if (!isValid) {
    console.error("❌ SMTP configuration is invalid. Check your credentials.");
    process.exit(1);
  }

  console.log("✅ SMTP configuration is valid!\n");

  // Test 2: Send a test email
  console.log("Test 2: Sending test email...");
  const testRecipient = process.env.SMTP_USER; // Send to yourself
  
  try {
    await sendEmail({
      to: testRecipient,
      subject: "Test Email - de_monax",
      html: `
        <h1>Test Email</h1>
        <p>If you're reading this, your email configuration is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
      `,
    });
    
    console.log(`✅ Test email sent successfully to ${testRecipient}`);
    console.log("\n🎉 All tests passed! Email is configured correctly.");
  } catch (error) {
    console.error("❌ Failed to send test email:", error.message);
    process.exit(1);
  }
}

testEmail();
