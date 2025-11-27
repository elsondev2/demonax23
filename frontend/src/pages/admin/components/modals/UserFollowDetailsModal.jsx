import { useState, useEffect } from 'react';
import { X, Users, UserCheck } from 'lucide-react';
import { axiosInstance } from '../../../../lib/axios';
import Avatar from '../../../../components/Avatar';
import PremiumBadge from '../../../../components/PremiumBadge';

export default function UserFollowDetailsModal({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'followers') {
      loadFollowers();
    } else {
      loadFollowing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user._id]);

  const loadFollowers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/follow/followers/${user._id}`);
      setFollowers(res.data || []);
    } catch (error) {
      console.error('Failed to load followers:', error);
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowing = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/follow/following/${user._id}`);
      setFollowing(res.data || []);
    } catch (error) {
      console.error('Failed to load following:', error);
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const currentList = activeTab === 'followers' ? followers : following;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>{user.fullName}'s Network</span>
              <PremiumBadge 
                tier={user.subscriptionPlan || user.premiumTier} 
                size="sm"
                showLabel
              />
            </h3>
            <p className="text-sm text-base-content/60">
              {user.followersCount} followers • {user.followingCount} following
            </p>
          </div>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed w-full mb-4">
          <a
            className={`tab flex-1 ${activeTab === 'followers' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('followers')}
          >
            <Users className="w-4 h-4 mr-2" />
            Followers ({followers.length})
          </a>
          <a
            className={`tab flex-1 ${activeTab === 'following' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Following ({following.length})
          </a>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {activeTab === 'followers'
                  ? 'No followers yet'
                  : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentList.map((followUser) => (
                <div
                  key={followUser._id}
                  className="flex items-center gap-3 p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                >
                  <Avatar
                    src={followUser.profilePic}
                    name={followUser.fullName}
                    alt={followUser.fullName}
                    size="w-10 h-10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-1">
                      <span className="truncate">{followUser.fullName}</span>
                      <PremiumBadge 
                        tier={followUser.subscriptionPlan || followUser.premiumTier} 
                        size="xs" 
                      />
                    </div>
                    <p className="text-xs text-base-content/60 truncate">
                      @{followUser.username || followUser.email?.split('@')[0]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}
