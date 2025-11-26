import mongoose from 'mongoose';

const pianoStatsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
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
      default: 0,
    },
    totalRecordings: {
      type: Number,
      default: 0,
    },
    lastPlayedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const PianoStats = mongoose.model('PianoStats', pianoStatsSchema);

export default PianoStats;
