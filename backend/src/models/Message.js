import mongoose from "mongoose";

const quotedMessageSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date },
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
    quotedMessage: quotedMessageSchema,
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
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
