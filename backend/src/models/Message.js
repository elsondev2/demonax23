import mongoose from "mongoose";

const quotedMessageSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date },
  },
  { _id: false }
);

const reactionSchema = new mongoose.Schema(
  {
    emoji: { type: String, required: true }, // e.g., "👍", "❤️", "😂"
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Make it optional since group messages won't have a single receiver
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      // For group messages
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    html: {
      type: String,
      trim: true,
      maxlength: 5000, // HTML is longer than plain text
    },
    image: {
      type: String,
    },
    imageStorageKey: { type: String, default: "" },
    // Generalized attachments list for documents/images/etc
    attachments: [
      {
        url: String,
        storageKey: String,
        contentType: String,
        filename: String,
        size: Number,
      }
    ],
    // Optional voice or audio clip
    audio: {
      url: String,
      storageKey: String,
      contentType: String,
      durationSec: Number,
    },
    youtubeLink: {
      type: String,
      trim: true,
    },
    quotedMessage: quotedMessageSchema,
    reactions: [reactionSchema],
    mentions: [
      {
        type: { type: String, enum: ['user', 'group', 'community', 'everyone', 'here'] },
        id: { type: mongoose.Schema.Types.ObjectId },
        name: String,
        username: String,
      }
    ],
    deliveredBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    readBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    senderDeleted: {
      type: Boolean,
      default: false,
    },
    senderDeletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
