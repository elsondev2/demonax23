import mongoose from "mongoose";

const statusSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mediaUrl: { type: String, required: true },
    storageKey: { type: String, required: true }, // Supabase object key for deletion
    mediaType: { type: String, enum: ["image", "video"], required: true },
    caption: { type: String, trim: true, default: "" },
    audience: { type: String, enum: ["contacts", "public"], default: "contacts" },
    // Optional background music
    audioUrl: { type: String, default: "" },
    audioStorageKey: { type: String, default: "" },
    audioDurationSec: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Optional index to help queries
statusSchema.index({ expiresAt: 1 });
statusSchema.index({ userId: 1, createdAt: -1 });

const Status = mongoose.model("Status", statusSchema);
export default Status;