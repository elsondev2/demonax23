import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import toast from "react-hot-toast";

export default function CleanupCard() {
  const [cleanupStats, setCleanupStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/api/admin/cleanup/stats');
      setCleanupStats(res.data);
    } catch (err) {
      toast.error('Failed to load cleanup stats');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleCleanup = async () => {
    if (!confirm('This will permanently remove message content from deleted users older than 120 days. Continue?')) {
      return;
    }

    setIsCleaning(true);
    try {
      const res = await axiosInstance.post('/api/admin/cleanup/deleted-messages');
      toast.success(`Cleaned up ${res.data.messagesCleaned} messages`);
      await loadStats(); // Reload stats
    } catch (err) {
      toast.error('Cleanup failed');
      console.error(err);
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <div className="flex items-center justify-between mb-2">
          <h3 className="card-title text-sm">Data Cleanup</h3>
          <Trash2 className="w-4 h-4 text-error" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-4">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        ) : cleanupStats ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Deleted User Messages</span>
              <span className="font-medium text-sm">{cleanupStats.totalDeletedUserMessages}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Ready for Cleanup</span>
              <span className="font-medium text-sm text-warning">{cleanupStats.messagesReadyForCleanup}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-base-content/60">Grace Period</span>
              <span className="font-medium text-sm text-success">{cleanupStats.messagesWithinGracePeriod}</span>
            </div>
            <div className="divider my-2"></div>
            <button
              className="btn btn-error btn-sm w-full"
              onClick={handleCleanup}
              disabled={isCleaning || cleanupStats.messagesReadyForCleanup === 0}
            >
              {isCleaning ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Cleaning...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Cleanup Old Messages
                </>
              )}
            </button>
            <p className="text-xs text-base-content/50 text-center">
              Removes content from messages older than 120 days
            </p>
          </div>
        ) : (
          <p className="text-sm text-error">Failed to load stats</p>
        )}
      </div>
    </div>
  );
}
