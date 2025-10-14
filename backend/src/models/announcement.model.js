import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['info', 'warning', 'alert', 'normal', 'high', 'urgent'],
      default: 'info'
    },
    bannerImage: {
      type: String,
      trim: true,
      default: null
    },
    bannerImagePublicId: {
      type: String,
      trim: true,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
