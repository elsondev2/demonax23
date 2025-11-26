import mongoose from 'mongoose';

const pianoStreamSchema = new mongoose.Schema(
  {
    streamerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    instrument: {
      type: String,
      required: true,
      default: 'grand-piano',
    },
    isLive: {
      type: Boolean,
      default: true,
    },
    listeners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    totalListeners: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for finding active streams
pianoStreamSchema.index({ isLive: 1, startedAt: -1 });

const PianoStream = mongoose.model('PianoStream', pianoStreamSchema);

export default PianoStream;
