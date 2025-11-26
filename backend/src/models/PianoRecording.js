import mongoose from "mongoose";

const pianoEventSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['noteOn', 'noteOff', 'sustain'],
      required: true,
    },
    note: String, // e.g., "C4", "D#5"
    velocity: Number, // 0-127
    value: Number, // for sustain (0 or 127)
    timestamp: {
      type: Number,
      required: true, // ms from start
    },
  },
  { _id: false }
);

const pianoRecordingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 100,
    },
    duration: {
      type: Number,
      required: true, // in seconds
    },
    instrument: {
      type: String,
      default: "grand-piano",
    },
    events: [pianoEventSchema],
    // Cloud storage (premium only)
    isCloud: {
      type: Boolean,
      default: true,
    },
    // Stats
    plays: {
      type: Number,
      default: 0,
    },
    // Visibility
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for user's recordings
pianoRecordingSchema.index({ userId: 1, createdAt: -1 });
pianoRecordingSchema.index({ isPublic: 1, plays: -1 });

const PianoRecording = mongoose.model("PianoRecording", pianoRecordingSchema);

export default PianoRecording;
