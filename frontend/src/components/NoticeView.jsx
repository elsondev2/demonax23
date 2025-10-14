import { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { Bell, TrendingUp, TrendingDown, Users, X, ChevronDown, Grid3x3, Heart } from 'lucide-react';
import Avatar from './Avatar';
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
  const [loading, setLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    if (activeTab === 'announcements') {
      loadAnnouncements();
    } else if (activeTab === 'rankings') {
      loadRankings();
    }
  }, [activeTab]);

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
      setAnnouncements(res.data || []);
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
      setRankings(res.data || []);
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

  return (
    <div className="relative h-full flex flex-col bg-base-100">
      <NoticeBackground />

      {/* Header */}
      <div className="flex-shrink-0 border-b border-base-300 bg-base-200/80 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <Bell className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Notice Board</h1>
            </div>
            
            {/* Navigation Dropdown */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                <ChevronDown className="w-5 h-5" />
              </label>
              <ul tabIndex={0} className="dropdown-content z-[80] menu p-2 shadow-lg bg-base-200 rounded-box w-52 mt-2">
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
          <div className="tabs tabs-boxed">
            <a
              className={`tab ${activeTab === 'announcements' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('announcements')}
            >
              Announcements
            </a>
            <a
              className={`tab ${activeTab === 'rankings' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('rankings')}
            >
              Rankings
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : activeTab === 'announcements' ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {announcements.length === 0 ? (
              <div className="card bg-base-200 border border-base-300 shadow-sm">
                <div className="card-body text-center py-12">
                  <Bell className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
                  <p className="text-base-content/60">No announcements yet</p>
                </div>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="card bg-base-200 border border-base-300 hover:border-base-content/20 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedAnnouncement(announcement)}
                >
                  {/* Banner Image */}
                  {announcement.bannerImage && (
                    <div className="relative w-full h-32 overflow-hidden">
                      <img
                        src={announcement.bannerImage}
                        alt={announcement.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="card-body p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base mb-2">{announcement.title}</h3>
                        <p className="text-sm text-base-content/70 line-clamp-2">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-base-content/60">
                          <span>{formatDate(announcement.createdAt)}</span>
                          {announcement.priority === 'high' && (
                            <span className="badge badge-warning badge-sm">Important</span>
                          )}
                          {announcement.priority === 'urgent' && (
                            <span className="badge badge-error badge-sm">Urgent</span>
                          )}
                        </div>
                      </div>
                      <Bell className="w-5 h-5 text-base-content/50 flex-shrink-0" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="alert alert-info">
              <Users className="w-5 h-5" />
              <span>User rankings based on followers/subscribers</span>
            </div>

            {rankings.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No rankings available yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rankings.map((user, index) => (
                  <div
                    key={user._id}
                    className="card bg-base-200 border border-base-300 hover:border-base-content/20 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="card-body p-4">
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex-shrink-0 w-12 text-center">
                          <div className={`text-2xl font-bold ${
                            index === 0 ? 'text-warning' :
                            index === 1 ? 'text-base-content/70' :
                            index === 2 ? 'text-orange-600' :
                            'text-base-content/50'
                          }`}>
                            #{index + 1}
                          </div>
                        </div>

                        {/* Avatar */}
                        <Avatar
                          src={user.profilePic}
                          name={user.fullName}
                          alt={user.fullName}
                          size="w-12 h-12"
                        />

                        {/* User Info */}
                        <div className="flex-1">
                          <h4 className="font-semibold">{user.fullName}</h4>
                          <p className="text-sm text-base-content/60">@{user.email?.split('@')[0]}</p>
                        </div>

                        {/* Stats and Follow Button */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">{user.followersCount || 0}</div>
                            <div className="text-xs text-base-content/60">Followers</div>
                          </div>
                          {user._id !== authUser?._id && (
                            <button className="btn btn-primary btn-sm">Follow</button>
                          )}
                          {index < rankings.length - 1 && user.followersCount > rankings[index + 1].followersCount ? (
                            <TrendingUp className="w-5 h-5 text-success" />
                          ) : index > 0 && user.followersCount < rankings[index - 1].followersCount ? (
                            <TrendingDown className="w-5 h-5 text-error" />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Announcement Detail Modal - iOS Style */}
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
  );
}
