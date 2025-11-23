import mongoose from "mongoose";

const checkersProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    points: {
      type: Number,
      default: 0
    },
    stats: {
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      totalGames: { type: Number, default: 0 },
      aiWins: {
        easy: { type: Number, default: 0 },
        medium: { type: Number, default: 0 },
        hard: { type: Number, default: 0 },
        expert: { type: Number, default: 0 }
      },
      arenaWins: { type: Number, default: 0 },
      arenaLosses: { type: Number, default: 0 }
    },
    achievements: [{
      name: String,
      description: String,
      unlockedAt: { type: Date, default: Date.now }
    }],
    currentStreak: {
      type: Number,
      default: 0
    },
    bestStreak: {
      type: Number,
      default: 0
    },
    lastGameAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const CheckersProfile = mongoose.model("CheckersProfile", checkersProfileSchema);

export default CheckersProfile;
