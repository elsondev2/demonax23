import Post from "../models/Post.js";
import { removeFromSupabase } from "./supabase.js";

export function startPostCleanupJob(intervalMs = 10 * 60 * 1000) { // every 10 minutes
  async function runOnce() {
    try {
      const now = new Date();
      const expired = await Post.find({ expiresAt: { $lte: now } }).limit(100);
      for (const p of expired) {
        try {
          for (const it of (p.items || [])) {
            if (it?.storageKey) { try { await removeFromSupabase(it.storageKey); } catch {} }
          }
        } catch {}
        await Post.findByIdAndDelete(p._id);
      }
    } catch (e) {
      console.log("Post cleanup job error:", e.message);
    }
  }

  setInterval(runOnce, intervalMs);
  setTimeout(runOnce, 5000);
}