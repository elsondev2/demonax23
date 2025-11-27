import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      sparse: true, // Allows null for phone-only users
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows null for email-only users
    },
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    status: {
      type: String,
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
    },
    profilePic: {
      type: String,
      default: "",
    },
    customBackground: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isBanned: { type: Boolean, default: false },
    
    // Premium/Subscription fields
    isPremium: { type: Boolean, default: false },
    premiumTier: {
      type: String,
      enum: ["free", "basic", "pro", "lifetime"],
      default: "free",
    },
    subscriptionPlan: {
      type: String,
      enum: ["none", "base", "pro", "premium"],
      default: "none",
    },
    premiumStartDate: { type: Date, default: null },
    premiumEndDate: { type: Date, default: null },
    premiumDuration: { type: Number, default: 0 }, // in days
    
    // Supporter/Donation fields
    isSupporter: { type: Boolean, default: false },
    supporterTier: {
      type: String,
      enum: ["none", "bronze", "silver", "gold", "platinum"],
      default: "none",
    },
    totalDonated: { type: Number, default: 0 },
    lastDonationDate: { type: Date, default: null },
    donationHistory: [{
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      note: { type: String, default: "" },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    }],
    
    // Payment tracking
    paymentStatus: {
      type: String,
      enum: ["active", "expired", "cancelled", "pending", "none"],
      default: "none",
    },
    autoRenew: { type: Boolean, default: false },
    paymentNotes: { type: String, default: "" },
    
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    // Email verification fields
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationMethod: {
      type: String,
      enum: ["email", "sms", "whatsapp"],
      default: "email",
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    signupAttempts: {
      type: Number,
      default: 0,
    },
    lastSignupAttempt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // createdAt & updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;
