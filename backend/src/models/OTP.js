import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      default: "email",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-delete expired documents
    },
    attempts: {
      type: Number,
      default: 0,
      max: 3,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
otpSchema.index({ userId: 1, isUsed: 1 });
otpSchema.index({ email: 1, isUsed: 1 });

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;
