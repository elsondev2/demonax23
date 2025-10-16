import FeatureRequest from "../models/FeatureRequest.js";

export function initFeatureRequestCleanup(intervalMs = 60 * 60 * 1000) { // every hour
  async function runOnce() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await FeatureRequest.deleteMany({
        status: 'denied',
        deniedAt: { $lt: oneDayAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`Feature request cleanup: Deleted ${result.deletedCount} old denied requests`);
      }
    } catch (e) {
      console.log("Feature request cleanup job error:", e.message);
    }
  }

  // run periodically
  setInterval(runOnce, intervalMs);
  // also run once on startup after small delay
  setTimeout(runOnce, 10000);
}