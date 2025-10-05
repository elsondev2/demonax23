import Status from "../models/Status.js";
import { removeFromSupabase } from "./supabase.js";

export function startStatusCleanupJob(intervalMs = 10 * 60 * 1000) { // every 10 minutes
  async function runOnce() {
    try {
      const now = new Date();
      const expired = await Status.find({ expiresAt: { $lte: now } }).limit(100);
      for (const st of expired) {
        try {
          await removeFromSupabase(st.storageKey);
        } catch (e) {
          // continue even if storage delete fails
        }
        await Status.findByIdAndDelete(st._id);
      }
    } catch (e) {
      console.log("Status cleanup job error:", e.message);
    }
  }

  // run periodically
  setInterval(runOnce, intervalMs);
  // also run once on startup after small delay
  setTimeout(runOnce, 5000);
}