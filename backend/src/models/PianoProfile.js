import mongoose from "mongoose";

const pianoProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Stats
    totalPlayTime: {
      type: Number,
      default: 0, // in seconds
    },
    totalStreams: {
      type: Number,
      default: 0,
    },
    totalListeners: {
      type: Number,
      default: 0, // cumulative
    },
    peakListeners: {
      type: Number,
      default: 0, // max at once
    },
    recordingsCount: {
      type: Number,
      default: 0,
    },
    // Social
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Preferences
    preferredInstrument: {
      type: String,
      default: "grand-piano",
    },
    // Achievements
    achievements: [{
      type: {
        type: String,
        enum: ['first_stream', 'first_recording', 'first_follower', 'hours_played_1', 'hours_played_10', 'hours_played_100'],
      },
      unlockedAt: Date,
    }],
  },
  { timestamps: true }
);

// Index for leaderboard queries
pianoProfileSchema.index({ totalPlayTime: -1 });
pianoProfileSchema.index({ totalListeners: -1 });
pianoProfileSchema.index({ 'followers': 1 });

const PianoProfile = mongoose.model("PianoProfile", pianoProfileSchema);

export default PianoProfile;
