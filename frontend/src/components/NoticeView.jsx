import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (activeTab === 'announcements') {
      loadAnnouncements();
    } else if (activeTab === 'rankings') {
      loadRankings();
    }
  }, [activeTab]);

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
  }, [activeTab]);

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
  }, [activeTab, announcementsAutoRefresh]);

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

  const loadAnnouncements = async () => {
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
  };

  const loadRankings = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/notices/rankings');
      const sortedRankings = (res.data || []).sort((a, b) => b.followersCount - a.followersCount);
      setPreviousRankings(rankings);
      setRankings(sortedRankings);
    } catch (error) {
      console.error('Failed to load rankings:', error);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {announcements.map((announcement) => {
                  const getPriorityStyles = (priority) => {
                    // Debug logging
                    console.log(`Processing priority for "${announcement.title}":`, priority);

                    switch (priority) {
                      case 'urgent':
                      case 'alert':
                        return {
                          card: 'border-l-4 border-l-error bg-error/5 hover:bg-error/10',
                          badge: 'badge-error',
                          icon: 'text-error',
                          glow: 'shadow-error/20'
                        };
                      case 'high':
                      case 'warning':
                        return {
                          card: 'border-l-4 border-l-warning bg-warning/5 hover:bg-warning/10',
                          badge: 'badge-warning',
                          icon: 'text-warning',
                          glow: 'shadow-warning/20'
                        };
                      case 'normal':
                      case 'info':
                      default:
                        return {
                          card: 'border-l-4 border-l-primary bg-primary/5 hover:bg-primary/10',
                          badge: 'badge-primary',
                          icon: 'text-primary',
                          glow: 'shadow-primary/20'
                        };
                    }
                  };

                  const priorityStyles = getPriorityStyles(announcement.priority || 'normal');

                  return (
                    <div
                      key={announcement._id}
                      className={`card bg-base-200 border border-base-300 hover:border-base-content/20 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group ${priorityStyles.card} ${priorityStyles.glow}`}
                      onClick={() => setSelectedAnnouncement(announcement)}
                    >
                      {/* Banner Image */}
                      {announcement.bannerImage && (
                        <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
                          <img
                            src={announcement.bannerImage}
                            alt={announcement.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        </div>
                      )}

                      <div className="card-body p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Priority Badge */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`badge badge-sm ${priorityStyles.badge}`}>
                                {announcement.priority === 'urgent' || announcement.priority === 'alert' ? 'Urgent' :
                                 announcement.priority === 'high' || announcement.priority === 'warning' ? 'Important' :
                                 announcement.priority === 'normal' || announcement.priority === 'info' ? 'Normal' : 'Normal'}
                              </span>
                              <span className="text-xs text-base-content/50">
                                {formatDate(announcement.createdAt)}
                              </span>
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors overflow-hidden"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical'
                                }}>
                              {announcement.title}
                            </h3>

                            {/* Content Preview */}
                            <p className="text-sm text-base-content/70 leading-relaxed overflow-hidden"
                               style={{
                                 display: '-webkit-box',
                                 WebkitLineClamp: 3,
                                 WebkitBoxOrient: 'vertical'
                               }}>
                              {announcement.content}
                            </p>
                          </div>

                          {/* Icon */}
                          <div className={`flex-shrink-0 p-2 rounded-full ${priorityStyles.icon} bg-base-100/50`}>
                            <Bell className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Read More Indicator */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-base-300/50">
                          <span className="text-xs text-base-content/50">Click to read more</span>
                          <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                            <span>View</span>
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary" />
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
                            <div className={`text-2xl sm:text-3xl font-bold ${
                              index === 0 ? 'text-warning' :
                              index === 1 ? 'text-base-content/70' :
                              index === 2 ? 'text-orange-600' :
                              'text-base-content/50'
                            }`}>
                              #{index + 1}
                            </div>
                            {rankingChange && rankingChange !== 'same' && (
                              <div className={`text-xs sm:text-sm flex items-center justify-center gap-1 mt-1 ${
                                rankingChange === 'up' ? 'text-success' :
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
        <IOSModal isOpen={!!selectedAnnouncement} onClose={() => setSelectedAnnouncement(null)}>
        {selectedAnnouncement && (
          <div className="p-6">
            {/* Banner Image in Modal */}
            {selectedAnnouncement.bannerImage && (
              <div className="relative w-full h-48 mb-6 rounded-lg overflow-hidden">
                <img
                  src={selectedAnnouncement.bannerImage}
                  alt={selectedAnnouncement.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h3 className="font-bold text-xl mb-4">{selectedAnnouncement.title}</h3>
            <p className="text-base-content/80 whitespace-pre-wrap mb-4">{selectedAnnouncement.content}</p>
            <div className="text-sm text-base-content/60 mb-6">
              Posted on {formatDate(selectedAnnouncement.createdAt)}
            </div>
            <button className="btn btn-primary w-full" onClick={() => setSelectedAnnouncement(null)}>
              Close
            </button>
          </div>
        )}
        </IOSModal>
      </div>
    </div>
  );
}
