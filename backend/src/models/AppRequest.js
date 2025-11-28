import mongoose from "mongoose";

const appRequestSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      required: true,
      trim: true,
    },
    appDescription: {
      type: String,
      required: true,
    },
    appUrl: {
      type: String,
      trim: true,
    },
    appCategory: {
      type: String,
      enum: ['productivity', 'social', 'entertainment', 'education', 'business', 'other'],
      default: 'other',
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'approved', 'rejected', 'implemented'],
      default: 'pending',
    },
    votes: {
      upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
      downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],
    },
    adminNotes: {
      type: String,
      default: '',
    },
    implementationDate: {
      type: Date,
    },
    discordMessageId: {
      type: String, // Store Discord message ID for updates
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
appRequestSchema.index({ status: 1, createdAt: -1 });
appRequestSchema.index({ requestedBy: 1 });
appRequestSchema.index({ 'votes.upvotes': 1 });

// Virtual for vote count
appRequestSchema.virtual('voteCount').get(function() {
  return (this.votes.upvotes?.length || 0) - (this.votes.downvotes?.length || 0);
});

// Ensure virtuals are included in JSON
appRequestSchema.set('toJSON', { virtuals: true });
appRequestSchema.set('toObject', { virtuals: true });

const AppRequest = mongoose.model("AppRequest", appRequestSchema);

export default AppRequest;
