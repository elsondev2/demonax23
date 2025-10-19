import { Resend } from "resend";
import { ENV } from "./env.js";

// Only initialize if API key is available
export const resendClient = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

export const sender = {
  email: ENV.EMAIL_FROM || "onboarding@resend.dev",
  name: ENV.EMAIL_FROM_NAME || "de_monax",
};

if (resendClient) {
  console.log("✅ Resend client initialized with API key");
} else {
  console.log("⚠️ Resend API key not found, email features may be limited");
}
