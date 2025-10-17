import { sendEmail } from "../lib/email.js";

export async function sendVerificationEmail(email, code) {
  try {
    await sendEmail({
      to: email,
      subject: "Verify Your Account - Your Code Inside",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                        Verify Your Account
                      </h1>
                      <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                        Welcome to de_monax! Let's get you started.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                        Thank you for signing up! To complete your registration, please use the verification code below:
                      </p>
                      
                      <!-- OTP Code -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td align="center" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 12px; padding: 30px;">
                            <div style="font-size: 42px; font-weight: 700; letter-spacing: 8px; color: #059669; font-family: 'Courier New', monospace;">
                              ${code}
                            </div>
                            <p style="margin: 15px 0 0 0; color: #047857; font-size: 14px;">
                              This code expires in <strong>10 minutes</strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 20px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                        If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                        This is an automated message, please do not reply to this email.
                      </p>
                      <p style="margin: 10px 0 0 0; color: #999999; font-size: 13px;">
                        © ${new Date().getFullYear()} de_monax. All rights reserved.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log(`✅ Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}
