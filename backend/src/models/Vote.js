import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true // One vote per user
    },
    vote: {
      type: String,
      enum: ["stay", "go"],
      required: true
    },
    reason: {
      type: String,
      default: "",
      maxlength: 500
    },
    userInfo: {
      fullName: String,
      email: String,
      profilePic: String
    },
    ipAddress: {
      type: String,
      default: ""
    },
    userAgent: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;
