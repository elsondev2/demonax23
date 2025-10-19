import { useState, useEffect, useCallback } from 'react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, TrendingUp, TrendingDown, Users, X, ChevronDown, Grid3x3, Heart, RefreshCw } from 'lucide-react';
import Avatar from './Avatar';
import FollowButton, { FollowerCount } from './FollowButton';
import { useChatStore } from '../store/useChatStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import IOSModal from './IOSModal';

function NoticeBackground() {
  const { chatBackground } = useChatStore();
  return (
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
      style={{
        backgroundImage: chatBackground ? `url('${chatBackground}')` : undefined,
        opacity: 0.1,
        zIndex: -1,
      }}
    />
  );
}

export default function NoticeView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { authUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'rankings'
  const [announcements, setAnnouncements] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [previousRankings, setPreviousRankings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [announcementsAutoRefresh, setAnnouncementsAutoRefresh] = useState(false);

  // Define callback functions BEFORE useEffect hooks
  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/notices/announcements');
      const announcementsData = res.data || [];

      // Debug logging to verify priority field
      console.log('Announcements loaded:', announcementsData.map(a => ({
        id: a._id,
        title: a.title,
        priority: a.priority,
        createdAt: a.createdAt
      })));

      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Failed to load announcements:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRankings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/notices/rankings');
      const sortedRankings = (res.data || []).sort((a, b) => b.followersCount - a.followersCount);
      setRankings(prevRankings => {
        setPreviousRankings(prevRankings);
        return sortedRankings;
      });
    } catch (error) {
      console.error('Failed to load rankings:', error);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Now useEffect hooks can safely reference the callbacks
  useEffect(() => {
    if (activeTab === 'announcements') {
      loadAnnouncements();
    } else if (activeTab === 'rankings') {
      loadRankings();
    }
  }, [activeTab, loadAnnouncements, loadRankings]);

  // Real-time updates for rankings when follow/unfollow events occur
  useEffect(() => {
    const handleFollowUpdate = () => {
      if (activeTab === 'rankings') {
        loadRankings();
      }
    };

    const handleUnfollowUpdate = () => {
      if (activeTab === 'rankings') {
        loadRankings();
      }
    };

    window.addEventListener('followUpdate', handleFollowUpdate);
    window.addEventListener('unfollowUpdate', handleUnfollowUpdate);

    return () => {
      window.removeEventListener('followUpdate', handleFollowUpdate);
      window.removeEventListener('unfollowUpdate', handleUnfollowUpdate);
    };
  }, [activeTab, loadRankings]);

  // Auto-refresh announcements every 45 seconds when announcements tab is active
  useEffect(() => {
    let interval;
    if (activeTab === 'announcements' && announcementsAutoRefresh) {
      interval = setInterval(() => {
        loadAnnouncements();
      }, 45000); // Refresh every 45 seconds for announcements
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, announcementsAutoRefresh, loadAnnouncements]);

  // Auto-refresh rankings when enabled
  useEffect(() => {
    let interval;
    if (activeTab === 'rankings' && autoRefresh) {
      interval = setInterval(() => {
        loadRankings();
      }, 45000); // Refresh every 45 seconds for rankings
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, autoRefresh, loadRankings]);

  // Handle highlight parameter from URL (for banner navigation)
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && announcements.length > 0) {
      const announcementToHighlight = announcements.find(a => a._id === highlightId);
      if (announcementToHighlight) {
        setSelectedAnnouncement(announcementToHighlight);
        // Clear the highlight parameter after opening
        searchParams.delete('highlight');
        setSearchParams(searchParams);
      }
    }
  }, [searchParams, announcements, setSearchParams]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRankingChange = (userId, currentIndex) => {
    if (!previousRankings.length) return null;

    const previousIndex = previousRankings.findIndex(user => user._id === userId);
    if (previousIndex === -1) return 'new'; // New user

    const change = previousIndex - currentIndex;
    if (change > 0) return 'up';
    if (change < 0) return 'down';
    return 'same';
  };

  return (
    <div className="relative h-full flex flex-col bg-base-100">
      <NoticeBackground />

      {/* Header */}
      <div className="relative z-20">
        <div className="flex-shrink-0 border-b border-base-300 bg-base-200/80 backdrop-blur-sm">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-bold">Notice Board</h1>
                  <p className="text-xs md:text-sm text-base-content/60">Stay updated with announcements and rankings</p>
                </div>
              </div>

              {/* Navigation Dropdown - Top Right */}
              <div className="dropdown dropdown-end">
                <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                  <ChevronDown className="w-5 h-5" />
                </label>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-200 rounded-box w-52 mt-2">
                  <li className="disabled">
                    <a className="flex items-center gap-2 opacity-50">
                      <Bell className="w-4 h-4" />
                      Notice Board
                    </a>
                  </li>
                  <li>
                    <a onClick={() => navigate('/apps')} className="flex items-center gap-2">
                      <Grid3x3 className="w-4 h-4" />
                      App Integrations
                    </a>
                  </li>
                  <li>
                    <a onClick={() => navigate('/donate')} className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Support & Contribute
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-boxed w-full">
              <a
                className={`tab flex-1 ${activeTab === 'announcements' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('announcements')}
              >
                <Bell className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Announcements</span>
              </a>
              <a
                className={`tab flex-1 ${activeTab === 'rankings' ? 'tab-active' : ''}`}
                onClick={() => setActiveTab('rankings')}
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Rankings</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 relative z-10">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : activeTab === 'announcements' ? (
          <div className="space-y-4 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <div className={`alert alert-info flex-1`}>
                <Bell className="w-5 h-5" />
                <span>Latest announcements and updates</span>
              </div>

              {/* Refresh button and auto-refresh toggle on the right */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={loadAnnouncements}
                  disabled={loading}
                  className="btn btn-primary btn-sm btn-circle"
                  title="Refresh announcements"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-base-content/70">Auto-refresh</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={announcementsAutoRefresh}
                    onChange={(e) => setAnnouncementsAutoRefresh(e.target.checked)}
                  />
                </div>
              </div>
            </div>

            {announcements.length === 0 ? (
              <div className="card bg-base-200 border border-base-300 shadow-sm">
                <div className="card-body text-center py-12">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
                  <p className="text-base-content/60">No announcements yet</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {announcements.map((announcement) => {
                  const getPriorityConfig = (priority) => {
                    switch (priority) {
                      case 'urgent':
                      case 'alert':
                        return {
                          gradient: 'from-red-500 via-rose-600 to-pink-600',
                          glowColor: 'shadow-red-500/30',
                          accentColor: 'bg-red-500',
                          textColor: 'text-red-600',
                          bgPattern: 'bg-red-50/50 dark:bg-red-950/20',
                          badgeText: 'URGENT',
                          ringColor: 'ring-red-500/30',
                          iconBg: 'bg-red-500'
                        };
                      case 'high':
                      case 'warning':
                        return {
                          gradient: 'from-amber-500 via-orange-500 to-orange-600',
                          glowColor: 'shadow-orange-500/30',
                          accentColor: 'bg-orange-500',
                          textColor: 'text-orange-600',
                          bgPattern: 'bg-orange-50/50 dark:bg-orange-950/20',
                          badgeText: 'IMPORTANT',
                          ringColor: 'ring-orange-500/30',
                          iconBg: 'bg-orange-500'
                        };
                      case 'normal':
                      case 'info':
                      default:
                        return {
                          gradient: 'from-blue-500 via-blue-600 to-blue-700',
                          glowColor: 'shadow-blue-500/30',
                          accentColor: 'bg-blue-500',
                          textColor: 'text-blue-600',
                          bgPattern: 'bg-blue-50/50 dark:bg-blue-950/20',
                          badgeText: 'INFO',
                          ringColor: 'ring-blue-500/30',
                          iconBg: 'bg-blue-500'
                        };
                    }
                  };

                  const config = getPriorityConfig(announcement.priority || 'normal');
                  const createdDate = new Date(announcement.createdAt);
                  const now = new Date();
                  const diffHours = Math.floor((now - createdDate) / (1000 * 60 * 60));
                  const isNew = diffHours < 24;

                  return (
                    <div
                      key={announcement._id}
                      className={`relative group overflow-hidden rounded-2xl bg-base-100 border border-base-300 hover:border-base-content/20 transition-all duration-500 ${config.glowColor} hover:shadow-2xl cursor-pointer flex flex-col`}
                      onClick={() => setSelectedAnnouncement(announcement)}
                    >
                      {/* Animated gradient bar on top */}
                      <div className={`h-1.5 bg-gradient-to-r ${config.gradient} relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </div>

                      {/* Decorative corner accent */}
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.gradient} opacity-5 rounded-bl-full`} />

                      {/* Banner Image */}
                      {announcement.bannerImage && (
                        <div className="relative w-full h-48 overflow-hidden">
                          <img
                            src={announcement.bannerImage}
                            alt={announcement.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                          {/* Floating badge on image */}
                          <div className="absolute top-3 right-3">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${config.gradient} shadow-lg backdrop-blur-sm`}>
                              {config.badgeText}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="relative p-5 flex flex-col flex-1">
                        {/* Header Section */}
                        <div className="flex items-start gap-4 mb-4">
                          {/* Animated Icon - only show if no banner */}
                          {!announcement.bannerImage && (
                            <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center shadow-lg ${config.glowColor} group-hover:scale-110 transition-transform duration-300`}>
                              <Bell className="w-7 h-7 text-white drop-shadow-lg" />
                              {isNew && (
                                <>
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full animate-ping" />
                                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full" />
                                </>
                              )}
                            </div>
                          )}

                          {/* Title and Badges */}
                          <div className="flex-1 min-w-0">
                            {/* Badges Row */}
                            {!announcement.bannerImage && (
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${config.gradient} shadow-md`}>
                                  {config.badgeText}
                                </span>
                                {isNew && (
                                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-primary to-secondary text-white shadow-md animate-pulse">
                                    ✨ NEW
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Title */}
                            <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2">
                              {announcement.title}
                            </h3>

                            {/* Date Badge */}
                            <div className="flex items-center gap-2 text-xs text-base-content/60">
                              <div className={`w-2 h-2 rounded-full ${config.accentColor} animate-pulse`} />
                              <span className="font-medium">
                                {formatDate(announcement.createdAt)}
                              </span>
                              {isNew && (
                                <span className="text-primary font-bold">
                                  • {diffHours < 1 ? 'Just now' : `${diffHours}h ago`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className={`${config.bgPattern} rounded-xl p-4 mb-4 border border-base-200 flex-1`}>
                          <p className="text-sm text-base-content/80 leading-relaxed line-clamp-3">
                            {announcement.content}
                          </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-base-200 mt-auto">
                          {/* Status Indicator - moved to footer */}
                          <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${config.bgPattern} border ${config.ringColor} ring-1`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${config.accentColor}`} />
                            <span className={`text-[10px] font-bold ${config.textColor} uppercase tracking-wide`}>Active</span>
                          </div>

                          {/* View Button */}
                          <div className="flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                            <span>VIEW</span>
                            <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${config.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all`}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 w-full max-w-none">
            <div className="flex items-center justify-between">
              <div className={`alert alert-info flex-1 mr-4`}>
                {activeTab === 'rankings' ? (
                  <>
                    <Users className="w-5 h-5" />
                    <span>User rankings based on followers/subscribers</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    <span>Latest announcements and updates</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={activeTab === 'rankings' ? loadRankings : loadAnnouncements}
                  disabled={loading}
                  className="btn btn-primary btn-sm btn-circle"
                  title={`Refresh ${activeTab}`}
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-base-content/60">Auto-refresh</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={activeTab === 'rankings' ? autoRefresh : announcementsAutoRefresh}
                    onChange={(e) => {
                      if (activeTab === 'rankings') {
                        setAutoRefresh(e.target.checked);
                      } else {
                        setAnnouncementsAutoRefresh(e.target.checked);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {rankings.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No rankings available yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {rankings.map((user, index) => {
                  const rankingChange = getRankingChange(user._id, index);
                  return (
                    <div
                      key={user._id}
                      className="card bg-base-200 border border-base-300 hover:border-base-content/20 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center gap-3 sm:gap-4 w-full">
                          {/* Rank */}
                          <div className="flex-shrink-0 w-12 sm:w-16 text-center">
                            <div className={`text-2xl sm:text-3xl font-bold ${index === 0 ? 'text-warning' :
                              index === 1 ? 'text-base-content/70' :
                                index === 2 ? 'text-orange-600' :
                                  'text-base-content/50'
                              }`}>
                              #{index + 1}
                            </div>
                            {rankingChange && rankingChange !== 'same' && (
                              <div className={`text-xs sm:text-sm flex items-center justify-center gap-1 mt-1 ${rankingChange === 'up' ? 'text-success' :
                                rankingChange === 'down' ? 'text-error' :
                                  rankingChange === 'new' ? 'text-primary' : ''
                                }`}>
                                {rankingChange === 'up' && <TrendingUp className="w-3 h-3" />}
                                {rankingChange === 'down' && <TrendingDown className="w-3 h-3" />}
                                {rankingChange === 'new' && <span className="text-xs">NEW</span>}
                              </div>
                            )}
                          </div>

                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <Avatar
                              src={user.profilePic}
                              name={user.fullName}
                              alt={user.fullName}
                              size="w-12 h-12 sm:w-14 sm:h-14"
                            />
                          </div>

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base sm:text-lg truncate">{user.fullName}</h4>
                            <p className="text-sm text-base-content/60 truncate">@{user.email?.split('@')[0]}</p>
                          </div>

                          {/* Stats and Follow Button */}
                          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                            <div className="text-right hidden sm:block">
                              <div className="text-sm font-medium">
                                <FollowerCount userId={user._id} />
                              </div>
                              <div className="text-xs text-base-content/50">followers</div>
                            </div>
                            <div className="text-right sm:hidden">
                              <div className="text-xs font-medium">
                                <FollowerCount userId={user._id} />
                              </div>
                            </div>
                            {user._id !== authUser?._id && (
                              <FollowButton userId={user._id} size="sm" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Announcement Detail Modal - iOS Style */}
      <div className="z-[150]">
        <IOSModal
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          className="max-w-2xl w-full mx-4"
        >
          {selectedAnnouncement && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-base-300 bg-base-100 flex-shrink-0">
                <h3 className="font-bold text-lg line-clamp-1">{selectedAnnouncement.title}</h3>
                <button
                  className="btn btn-sm btn-circle btn-ghost hover:bg-base-200"
                  onClick={() => setSelectedAnnouncement(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-base-100">
                {/* Banner Image in Modal */}
                {selectedAnnouncement.bannerImage && (
                  <div className="relative w-full h-48 mb-6 rounded-lg overflow-hidden">
                    <img
                      src={selectedAnnouncement.bannerImage}
                      alt={selectedAnnouncement.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                <p className="text-base-content/80 whitespace-pre-wrap leading-relaxed mb-4">
                  {selectedAnnouncement.content}
                </p>

                <div className="text-sm text-base-content/60">
                  Posted on {formatDate(selectedAnnouncement.createdAt)}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-base-300 bg-base-100 flex-shrink-0">
                <button
                  className="btn btn-primary"
                  onClick={() => setSelectedAnnouncement(null)}
                >
                  Close
                </button>
              </div>
            </>
          )}
        </IOSModal>
      </div>
    </div>
  );
}
