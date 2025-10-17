import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
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
