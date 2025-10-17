import OTP from "../models/OTP.js";
import { sendVerificationEmail } from "../emails/verification.email.js";

/**
 * Generate 6-digit OTP
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create and send OTP
 */
export async function createAndSendOTP(userId, email, method = "email") {
  // Invalidate any existing OTPs for this user
  await OTP.updateMany(
    { userId, isUsed: false },
    { isUsed: true }
  );

  // Generate new OTP
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Save OTP to database
  const otp = await OTP.create({
    userId,
    email,
    code,
    method,
    expiresAt,
  });

  // Send OTP via email
  if (method === "email") {
    await sendVerificationEmail(email, code);
  }
  // TODO: Add SMS and WhatsApp methods later

  return otp;
}

/**
 * Verify OTP
 */
export async function verifyOTP(userId, code) {
  // Find valid OTP
  const otp = await OTP.findOne({
    userId,
    code,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  });

  if (!otp) {
    // Check if OTP exists but expired
    const expiredOTP = await OTP.findOne({
      userId,
      code,
      isUsed: false,
    });

    if (expiredOTP) {
      return { success: false, error: "OTP has expired" };
    }

    // Check attempts
    const recentOTP = await OTP.findOne({ userId, isUsed: false });
    if (recentOTP) {
      recentOTP.attempts += 1;
      await recentOTP.save();

      if (recentOTP.attempts >= 3) {
        recentOTP.isUsed = true;
        await recentOTP.save();
        return { success: false, error: "Too many attempts. Please request a new code." };
      }
    }

    return { success: false, error: "Invalid OTP code" };
  }

  // Mark OTP as used
  otp.isUsed = true;
  await otp.save();

  return { success: true };
}

/**
 * Check rate limiting
 */
export async function checkRateLimit(userId) {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // Check last minute
  const recentOTP = await OTP.findOne({
    userId,
    createdAt: { $gt: oneMinuteAgo },
  });

  if (recentOTP) {
    return {
      allowed: false,
      error: "Please wait 1 minute before requesting another code",
    };
  }

  // Check last hour (max 5 requests)
  const hourlyCount = await OTP.countDocuments({
    userId,
    createdAt: { $gt: oneHourAgo },
  });

  if (hourlyCount >= 5) {
    return {
      allowed: false,
      error: "Too many requests. Please try again later.",
    };
  }

  return { allowed: true };
}
