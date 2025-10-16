import { useState, useEffect } from "react";
import { UserPlus, UserMinus } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

// Follower Count Display Component
export function FollowerCount({ userId, className = "" }) {
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFollowerCount = async () => {
    try {
      const res = await axiosInstance.get(`/api/follow/stats/${userId}`);
      setFollowerCount(res.data.followersCount);
    } catch (error) {
      console.error("Error fetching follower count:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFollowerCount();
    }
  }, [userId]);

  // Listen for real-time follower updates
  useEffect(() => {
    const { socket } = useAuthStore.getState();

    const handleNewFollower = (data) => {
      if (data.userId === userId) {
        setFollowerCount(prev => prev + 1);
      }
    };

    const handleFollowerRemoved = (data) => {
      if (data.userId === userId) {
        setFollowerCount(prev => Math.max(0, prev - 1));
      }
    };

    if (socket) {
      socket.on("newFollower", handleNewFollower);
      socket.on("followerRemoved", handleFollowerRemoved);

      return () => {
        socket.off("newFollower", handleNewFollower);
        socket.off("followerRemoved", handleFollowerRemoved);
      };
    }
  }, [userId]);

  if (loading) {
    return <span className={`text-sm text-base-content/60 ${className}`}>...</span>;
  }

  return (
    <span className={`text-sm text-base-content/60 ${className}`}>
      {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
    </span>
  );
}

export default function FollowButton({ userId, size = "sm", className = "", onFollowChange }) {
  const { authUser } = useAuthStore();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && authUser?._id) {
      checkFollowStatus();
    }
  }, [userId, authUser?._id]);

  // Listen for real-time follower updates
  useEffect(() => {
    const { socket } = useAuthStore.getState();

    const handleNewFollower = (data) => {
      if (data.followerId === authUser?._id && data.userId === userId) {
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    };

    const handleFollowerRemoved = (data) => {
      if (data.followerId === authUser?._id && data.userId === userId) {
        setIsFollowing(false);
        onFollowChange?.(false);
      }
    };

    if (socket) {
      socket.on("newFollower", handleNewFollower);
      socket.on("followerRemoved", handleFollowerRemoved);

      return () => {
        socket.off("newFollower", handleNewFollower);
        socket.off("followerRemoved", handleFollowerRemoved);
      };
    }
  }, [userId, authUser?._id, onFollowChange]);

  const checkFollowStatus = async () => {
    try {
      const res = await axiosInstance.get(`/api/follow/following/${authUser._id}`);
      const following = res.data || [];
      setIsFollowing(following.some(u => u._id === userId));
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const handleFollowToggle = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click events
    if (loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await axiosInstance.post(`/api/follow/unfollow/${userId}`);
        setIsFollowing(false);
        toast.success("Unfollowed");
      } else {
        await axiosInstance.post(`/api/follow/follow/${userId}`);
        setIsFollowing(true);
        toast.success("Following");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update follow status");
    } finally {
      setLoading(false);
    }
  };

  // Don't show button if viewing own profile
  if (!userId || userId === authUser?._id) {
    return null;
  }

  return (
    <button
      className={`btn btn-${size} ${isFollowing ? 'btn-outline' : 'btn-primary'} gap-1 ${className}`}
      onClick={handleFollowToggle}
      disabled={loading}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : isFollowing ? (
        <>
          <UserMinus className="w-3 h-3" />
          <span className="hidden sm:inline">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-3 h-3" />
          <span className="hidden sm:inline">Follow</span>
        </>
      )}
    </button>
  );
}
