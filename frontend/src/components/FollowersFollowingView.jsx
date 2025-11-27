import { useState, useEffect } from 'react';
import { Users, UserPlus, UserCheck, ArrowLeft } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import Avatar from './Avatar';
import PremiumBadge from './PremiumBadge';
import FollowButton from './FollowButton';
import UserProfileModal from './UserProfileModal';

export default function FollowersFollowingView({ onBack }) {
  const { authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('followers'); // 'followers' | 'following'
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (activeTab === 'followers') {
      loadFollowers();
    } else {
      loadFollowing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadFollowers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/follow/followers/${authUser._id}`);
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
      const res = await axiosInstance.get(`/api/follow/following/${authUser._id}`);
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
    <div className="h-full flex flex-col bg-base-100">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-base-300 bg-base-200/80 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold">My Network</h1>
              <p className="text-xs md:text-sm text-base-content/60">
                Manage your followers and following
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed w-full">
            <a
              className={`tab flex-1 ${activeTab === 'followers' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('followers')}
            >
              <Users className="w-4 h-4 mr-2" />
              <span>Followers ({followers.length})</span>
            </a>
            <a
              className={`tab flex-1 ${activeTab === 'following' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('following')}
            >
              <UserCheck className="w-4 h-4 mr-2" />
              <span>Following ({following.length})</span>
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-12 text-base-content/60">
            <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>
              {activeTab === 'followers'
                ? 'No followers yet'
                : 'Not following anyone yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl mx-auto">
            {currentList.map((user) => (
              <div
                key={user._id}
                className="card bg-base-200 border border-base-300 hover:border-base-content/20 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="card-body p-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full">
                    {/* Avatar */}
                    <div 
                      className="flex-shrink-0 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar
                        src={user.profilePic}
                        name={user.fullName}
                        alt={user.fullName}
                        size="w-12 h-12 sm:w-14 sm:h-14"
                      />
                    </div>

                    {/* User Info */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <h4 className="font-semibold text-base sm:text-lg truncate flex items-center gap-1">
                        <span className="truncate">{user.fullName}</span>
                        <PremiumBadge 
                          tier={user.subscriptionPlan || user.premiumTier} 
                          size="xs" 
                        />
                      </h4>
                      <p className="text-sm text-base-content/60 truncate">
                        @{user.username || user.email?.split('@')[0]}
                      </p>
                    </div>

                    {/* Follow Button */}
                    <div className="flex-shrink-0">
                      <FollowButton 
                        userId={user._id} 
                        size="sm"
                        onFollowChange={() => {
                          // Refresh the lists
                          if (activeTab === 'followers') {
                            loadFollowers();
                          } else {
                            loadFollowing();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
