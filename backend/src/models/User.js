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
  },
  { timestamps: true } // createdAt & updatedAt
);

const User = mongoose.model("User", userSchema);

export default User;
