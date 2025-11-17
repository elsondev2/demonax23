import { useState, useEffect, useCallback } from 'react';
import { Heart, Coffee, DollarSign, Send, Star, TrendingUp, Zap, Gift, CheckCircle, Users, MessageSquare, ThumbsUp, ChevronDown, Bell, Grid3x3, AlertCircle, Info, Code, Shield, Target, Clock, X } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router';
import { axiosInstance } from '../lib/axios';
import { useSocket } from '../contexts/SocketContext';
import { useThemeStore } from '../store/useThemeStore';
import { isDarkTheme } from '../constants/themes';

function DonateBackground() {
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

const DONATION_TIERS = [
  {
    id: 'basic',
    name: 'Basic Support',
    amount: 6000,
    icon: Coffee,
    color: 'bg-amber-500',
    description: 'Support with basic tier',
    perks: ['Our gratitude', 'Supporter badge', 'Basic features']
  },
  {
    id: 'pro',
    name: 'Pro Support',
    amount: 20000,
    icon: Gift,
    color: 'bg-blue-500',
    description: 'Help fuel development',
    perks: ['All Basic perks', 'Priority support', 'Early feature access', 'Pro badge']
  },
  {
    id: 'premium',
    name: 'Premium Support',
    amount: 35000,
    icon: Star,
    color: 'bg-purple-500',
    description: 'Become a premium supporter',
    perks: ['All Pro perks', 'Custom feature request', 'Direct developer contact', 'VIP badge']
  }
];

const FEATURE_CATEGORIES = [
  { id: 'ui', name: 'UI/UX', icon: Star },
  { id: 'feature', name: 'New Feature', icon: Zap },
  { id: 'improvement', name: 'Improvement', icon: TrendingUp },
  { id: 'bug', name: 'Bug Fix', icon: CheckCircle }
];

const ToastNotification = ({ toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === 'success';
  const iconPath = isSuccess
    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z";

  return (
    <div className="fixed top-4 right-4 z-[200] max-w-sm">
      <div className={`alert ${isSuccess ? 'alert-success' : 'alert-error'} shadow-lg`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
        </svg>
        <span className="text-sm">{toast.message}</span>
      </div>
    </div>
  );
};

const StatSkeleton = () => (
  <div className="stat bg-base-200 rounded-lg p-4 shadow animate-pulse">
    <div className="stat-title text-xs h-4 bg-base-300 rounded w-3/4 mb-2"></div>
    <div className="stat-value text-2xl h-8 bg-base-300 rounded w-1/2 mb-1"></div>
    <div className="stat-desc text-xs h-3 bg-base-300 rounded w-full"></div>
  </div>
);

export default function DonateView() {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { currentTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('donate');
  const { toast, showToast } = useToast();

  // Feature request states
  const [featureTitle, setFeatureTitle] = useState('');
  const [featureDescription, setFeatureDescription] = useState('');
  const [featureCategory, setFeatureCategory] = useState('feature');
  const [isAnonymousRequest, setIsAnonymousRequest] = useState(false);
  const [showKibubuModal, setShowKibubuModal] = useState(false);

  // Stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Feature requests state
  const [featureRequests, setFeatureRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Try to get donation stats and public stats (both don't require admin auth)
        const [donationResponse, publicStatsResponse] = await Promise.allSettled([
          axiosInstance.get('/api/donations/stats'),
          axiosInstance.get('/api/donations/public-stats')
        ]);

        let donationStats = null;
        let publicStats = null;

        if (donationResponse.status === 'fulfilled') {
          donationStats = donationResponse.value.data;
        }

        if (publicStatsResponse.status === 'fulfilled') {
          publicStats = publicStatsResponse.value.data;
        }

        // Use real data from both endpoints
        // Feature count based on actual app features:
        // 1. Real-time messaging, 2. Group chats, 3. Friend system, 4. User profiles
        // 5. Status updates/posts, 6. File sharing, 7. Voice/Video calls, 8. Notifications
        // 9. Themes, 10. Chat backgrounds, 11. User mentions, 12. Message reactions
        // 13. Admin panel, 14. Payment system, 15. Notice board, 16. App integrations
        // 17. KIBUBU (feature requests), 18. Community page, 19. Search functionality
        // 20. Message editing/deletion, 21. Group management, 22. User banning
        // 23. Premium tiers, 24. Supporter system, 25. Real-time presence
        // 26. Typing indicators, 27. Read receipts, 28. Message forwarding
        // 29. Profile customization, 30. Privacy settings
        const featuresBuilt = 30;

        const stats = {
          totalSupporters: donationStats?.stats?.totalSupporters || 0,
          monthlyDonations: donationStats?.stats?.monthlyDonations || 0,
          featuresBuilt: featuresBuilt,
          activeUsers: publicStats?.activeUsers || 0,
          recentDonations: donationStats?.recentDonations || []
        };

        setStats(stats);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStatsError('Failed to load community stats. Please try again later.');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch feature requests function
  const fetchFeatureRequests = useCallback(async () => {
    if (activeTab === 'request') {
      try {
        setRequestsLoading(true);
        setRequestsError(null);
        const response = await axiosInstance.get('/api/feature-requests/trending?limit=10');
        if (response.data && response.data.requests) {
          setFeatureRequests(response.data.requests);
        } else {
          setRequestsError('Failed to load feature requests.');
        }
      } catch (error) {
        console.error('Error fetching feature requests:', error);
        setRequestsError('Failed to load feature requests. Please check your connection.');
      } finally {
        setRequestsLoading(false);
      }
    }
  }, [activeTab]);

  // Fetch feature requests when component mounts or tab changes
  useEffect(() => {
    fetchFeatureRequests();
  }, [fetchFeatureRequests]);

  // Also fetch requests when component first mounts (in case user lands directly on request tab)
  useEffect(() => {
    if (featureRequests.length === 0 && !requestsLoading && !requestsError) {
      fetchFeatureRequests();
    }
  }, [featureRequests.length, requestsLoading, requestsError, fetchFeatureRequests]);

  // Scroll to top when tab changes
  useEffect(() => {
    const contentArea = document.querySelector('.donate-content-area');
    if (contentArea) {
      contentArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Socket.io real-time updates for feature requests
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdate = (updatedRequest) => {
      setFeatureRequests(prevRequests =>
        prevRequests.map(request =>
          request._id === updatedRequest.id
            ? {
              ...request,
              upvotes: updatedRequest.upvotes,
              downvotes: updatedRequest.downvotes,
              voteScore: updatedRequest.voteScore,
              userVote: updatedRequest.userVote
            }
            : request
        )
      );
    };

    const handleNewRequest = (newRequest) => {
      setFeatureRequests(prevRequests => [newRequest, ...prevRequests]);
      showToast('New feature request submitted!', 'info');
    };

    const handleStatusUpdate = (updatedRequest) => {
      setFeatureRequests(prevRequests =>
        prevRequests.map(request =>
          request._id === updatedRequest.id
            ? { ...request, status: updatedRequest.status }
            : request
        )
      );

      if (updatedRequest.status === 'approved') {
        showToast('Feature request approved! 🎉', 'success');
      } else if (updatedRequest.status === 'implemented') {
        showToast('Feature request implemented! 🚀', 'success');
      }
    };

    socket.on('featureRequest:vote', handleVoteUpdate);
    socket.on('featureRequest:new', handleNewRequest);
    socket.on('featureRequest:statusChange', handleStatusUpdate);

    return () => {
      socket.off('featureRequest:vote', handleVoteUpdate);
      socket.off('featureRequest:new', handleNewRequest);
      socket.off('featureRequest:statusChange', handleStatusUpdate);
    };
  }, [socket, showToast]);

  const handleFeatureRequest = async () => {
    if (!featureTitle.trim() || !featureDescription.trim()) {
      showToast('Please fill in both title and description.', 'error');
      return;
    }

    if (featureTitle.trim().length < 5 || featureTitle.trim().length > 100) {
      showToast('Title must be between 5 and 100 characters.', 'error');
      return;
    }

    if (featureDescription.trim().length < 20 || featureDescription.trim().length > 1000) {
      showToast('Description must be between 20 and 1000 characters.', 'error');
      return;
    }

    try {
      const response = await axiosInstance.post('/api/feature-requests/submit', {
        title: featureTitle.trim(),
        description: featureDescription.trim(),
        category: featureCategory,
        isAnonymous: isAnonymousRequest,
        contactEmail: null
      });

      if (response.data.success) {
        showToast(`Idea submitted successfully! 🎉 ${isAnonymousRequest ? '(Anonymous)' : '(Public)'}`, 'success');
        setFeatureTitle('');
        setFeatureDescription('');
        setFeatureCategory('feature');
        setIsAnonymousRequest(false);
        setShowKibubuModal(false);

        // Refresh the trending requests
        if (activeTab === 'request') {
          fetchFeatureRequests();
        }

        // Refresh stats
        const statsResponse = await axiosInstance.get('/api/donations/public-stats');
        if (statsResponse.data.success) {
          setStats(prev => ({
            ...prev,
            activeUsers: statsResponse.data.activeUsers
          }));
        }
      } else {
        showToast(response.data.message || 'Failed to submit idea.', 'error');
      }
    } catch (error) {
      console.error('Error submitting idea:', error);
      if (error.response?.status === 429) {
        showToast('Too many requests. Please wait before submitting another idea.', 'error');
      } else {
        showToast('Failed to submit idea. Please try again.', 'error');
      }
    }
  };

  // Handle voting on feature requests
  const handleVote = async (requestId, voteType) => {
    try {
      const response = await axiosInstance.post(`/api/feature-requests/${requestId}/vote`, {
        voteType
      });

      if (response.data.success) {
        showToast(`Request ${voteType}voted!`, 'success');

        // Update local state with new vote counts
        setFeatureRequests(prevRequests =>
          prevRequests.map(request =>
            request._id === requestId
              ? {
                ...request,
                upvotes: response.data.featureRequest.upvotes,
                downvotes: response.data.featureRequest.downvotes,
                voteScore: response.data.featureRequest.voteScore,
                userVote: response.data.featureRequest.userVote
              }
              : request
          )
        );
      } else {
        showToast(response.data.message || 'Failed to vote.', 'error');
      }
    } catch (error) {
      console.error('Error voting:', error);
      if (error.response?.status === 401) {
        showToast('Please log in to vote on feature requests.', 'error');
      } else {
        showToast('Failed to vote. Please try again.', 'error');
      }
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-base-100">
      <DonateBackground />

      {/* Header */}
      <div className="relative z-10 flex-shrink-0 border-b border-base-300 bg-base-200">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-error flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold">Support & Contribute</h1>
                <p className="text-xs md:text-sm text-base-content/60">Help us build something amazing</p>
              </div>
            </div>

            {/* Navigation Dropdown */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                <ChevronDown className="w-5 h-5" />
              </label>
              <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow-lg bg-base-200 rounded-box w-52 mt-2">
                <li>
                  <a onClick={() => navigate('/notices')} className="flex items-center gap-2">
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
                <li className="disabled">
                  <a className="flex items-center gap-2 opacity-50">
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
              className={`tab flex-1 ${activeTab === 'donate' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('donate')}
            >
              <Heart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Supporters</span>
            </a>
            <a
              className={`tab flex-1 ${activeTab === 'request' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('request')}
            >
              <Zap className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">KIBUBU</span>
            </a>
            <a
              className={`tab flex-1 ${activeTab === 'community' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Community</span>
            </a>
            <a
              className={`tab flex-1 ${activeTab === 'about' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <Info className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">About</span>
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 donate-content-area">
        {activeTab === 'donate' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Hero Section */}
            <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl">
              <div className="card-body text-center py-12">
                <Heart className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Our Amazing Supporters</h2>
                <p className="text-primary-content/90 max-w-2xl mx-auto">
                  {stats?.totalSupporters > 0
                    ? `${stats.totalSupporters} incredible people are helping us build something amazing! Every contribution makes a difference.`
                    : "Be among the first to support this project and help us grow!"}
                </p>
              </div>
            </div>

            {/* Impact Stats */}
            {statsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </div>
            ) : statsError ? (
              <div className="alert alert-error">
                <AlertCircle className="w-5 h-5" />
                <span>{statsError}</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="stat bg-base-200 rounded-lg p-4 shadow">
                  <div className="stat-title text-xs">Total Supporters</div>
                  <div className="stat-value text-2xl text-primary">{stats.totalSupporters}</div>
                  <div className="stat-desc text-xs">Thank you! ❤️</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4 shadow">
                  <div className="stat-title text-xs">This Month</div>
                  <div className="stat-value text-2xl text-secondary">{stats.monthlyDonations.toLocaleString()} TSh</div>
                  <div className="stat-desc text-xs">Fueling development</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4 shadow">
                  <div className="stat-title text-xs">Features Built</div>
                  <div className="stat-value text-2xl text-accent">{stats.featuresBuilt}</div>
                  <div className="stat-desc text-xs">And counting!</div>
                </div>
                <div className="stat bg-base-200 rounded-lg p-4 shadow">
                  <div className="stat-title text-xs">Active Users</div>
                  <div className="stat-value text-2xl text-success">{stats.activeUsers.toLocaleString()}</div>
                  <div className="stat-desc text-xs">Growing strong</div>
                </div>
              </div>
            )}

            {/* Supporters List */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="card-title text-lg">
                    <Gift className="w-6 h-6 text-secondary" />
                    Our Supporters
                  </h3>
                  {stats?.recentDonations?.length > 0 && (
                    <span className="badge badge-secondary badge-sm">
                      {stats.recentDonations.length} supporter{stats.recentDonations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {stats?.recentDonations?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stats.recentDonations.map((supporter) => (
                      <div key={supporter.id} className="card bg-base-300 shadow hover:shadow-lg transition-shadow">
                        <div className="card-body p-4">
                          <div className="flex items-start gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-primary text-primary-content rounded-full w-12">
                                {supporter.avatar ? (
                                  <img src={supporter.avatar} alt={supporter.name} className="rounded-full" />
                                ) : (
                                  <span className="text-lg">{supporter.name[0]}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-base">{supporter.name}</span>
                                <div className="badge badge-primary badge-lg font-bold">
                                  {supporter.amount.toLocaleString()} TSh
                                </div>
                              </div>
                              {supporter.message && (
                                <p className="text-sm text-base-content/80 mb-2 italic">"{supporter.message}"</p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-base-content/60">
                                <Clock className="w-3 h-3" />
                                <span>{supporter.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-base-content/60">
                    <Gift className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-semibold mb-2">No supporters yet</p>
                    <p className="text-sm">Be the first to support this project and help us grow!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'request' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* KIBUBU Hero */}
            <div className="card bg-gradient-to-br from-accent to-info text-accent-content shadow-xl">
              <div className="card-body text-center py-12">
                <Zap className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-4xl font-bold mb-2">KIBUBU</h2>
                <p className="text-lg text-accent-content/90 mb-2">Your Ideas, Our Future</p>
                <p className="text-accent-content/80 max-w-2xl mx-auto mb-6">
                  Share your brilliant ideas and help shape the future of de_monax! Every suggestion matters.
                </p>
                <button
                  className="btn btn-lg bg-accent-content text-accent hover:bg-accent-content/90 gap-2"
                  onClick={() => setShowKibubuModal(true)}
                >
                  <Send className="w-5 h-5" />
                  Submit Your Idea
                </button>
              </div>
            </div>

            {/* KIBUBU Modal */}
            {showKibubuModal && (
              <div className="modal modal-open">
                <div className="modal-box w-full max-w-3xl max-h-[90vh] flex flex-col p-0">
                  {/* Modal Header */}
                  <div className="flex-shrink-0 bg-gradient-to-r from-accent to-info text-accent-content p-6 border-b border-accent-content/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-accent-content/20 flex items-center justify-center">
                          <Zap className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Submit to KIBUBU</h3>
                          <p className="text-sm text-accent-content/80">Share your brilliant idea</p>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={() => setShowKibubuModal(false)}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Category Selection */}
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-semibold">Category</span>
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {FEATURE_CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              className={`btn btn-sm ${featureCategory === cat.id ? 'btn-accent' : 'btn-outline'}`}
                              onClick={() => setFeatureCategory(cat.id)}
                            >
                              <Icon className="w-4 h-4 mr-1" />
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">Idea Title</span>
                        <span className="label-text-alt text-xs">{featureTitle.length}/100</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Dark mode for chat interface"
                        className="input input-bordered w-full"
                        value={featureTitle}
                        onChange={(e) => setFeatureTitle(e.target.value)}
                        maxLength={100}
                      />
                    </div>

                    {/* Description */}
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-semibold">Detailed Description</span>
                        <span className="label-text-alt text-xs">{featureDescription.length}/1000</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full h-40 resize-none"
                        placeholder="Describe your idea in detail. What problem does it solve? How would it work?"
                        value={featureDescription}
                        onChange={(e) => setFeatureDescription(e.target.value)}
                        maxLength={1000}
                      ></textarea>
                    </div>

                    {/* Anonymous Toggle */}
                    <div className="form-control">
                      <label className="label cursor-pointer justify-start gap-3">
                        <input
                          type="checkbox"
                          className="toggle toggle-accent"
                          checked={isAnonymousRequest}
                          onChange={(e) => setIsAnonymousRequest(e.target.checked)}
                        />
                        <div>
                          <span className="label-text font-semibold">Submit anonymously</span>
                          <p className="text-xs text-base-content/60 mt-1">
                            {isAnonymousRequest
                              ? "Your idea will be submitted without your name."
                              : "Your idea will be associated with your account."}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex-shrink-0 border-t border-base-300 p-4 bg-base-200">
                    <div className="flex gap-3 justify-end">
                      <button
                        className="btn btn-ghost"
                        onClick={() => setShowKibubuModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-accent gap-2"
                        onClick={handleFeatureRequest}
                        disabled={!featureTitle.trim() || !featureDescription.trim()}
                      >
                        <Send className="w-4 h-4" />
                        Submit Idea
                      </button>
                    </div>
                  </div>
                </div>
                <div className="modal-backdrop" onClick={() => setShowKibubuModal(false)}></div>
              </div>
            )}



            {/* Popular Requests */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="card-title text-lg">Trending Ideas</h3>
                      <p className="text-xs text-base-content/60">Community's most popular requests</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {featureRequests.length > 0 && (
                      <span className="badge badge-primary badge-sm">
                        {featureRequests.length} idea{featureRequests.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    <button
                      className="btn btn-ghost btn-sm btn-circle"
                      onClick={fetchFeatureRequests}
                      disabled={requestsLoading}
                      title="Refresh requests"
                    >
                      {requestsLoading ? (
                        <div className="loading loading-spinner loading-xs"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {requestsLoading ? (
                  <div className="text-center py-12">
                    <div className="loading loading-spinner loading-lg mx-auto mb-4"></div>
                    <p className="text-sm text-base-content/60">Loading brilliant ideas...</p>
                  </div>
                ) : requestsError ? (
                  <div className="alert alert-error">
                    <AlertCircle className="w-5 h-5" />
                    <span>{requestsError}</span>
                  </div>
                ) : featureRequests.length > 0 ? (
                  <div className="space-y-3">
                    {featureRequests.map((request) => (
                      <div key={request._id} className="card bg-base-300 shadow-md hover:shadow-xl transition-all border border-base-content/10">
                        <div className="card-body p-5">
                          <div className="flex items-start gap-4">
                            {/* Voting Section - Left Side */}
                            <div className="flex flex-col items-center gap-2 min-w-[60px]">
                              <button
                                className={`btn btn-sm btn-circle ${request.userVote === 'up' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => handleVote(request._id, 'up')}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <div className="font-bold text-lg">{request.voteScore || 0}</div>
                              <button
                                className={`btn btn-sm btn-circle ${request.userVote === 'down' ? 'btn-error' : 'btn-ghost'}`}
                                onClick={() => handleVote(request._id, 'down')}
                              >
                                <ThumbsUp className="w-4 h-4 rotate-180" />
                              </button>
                            </div>

                            {/* Content - Right Side */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className={`badge ${request.category === 'bug' ? 'badge-error' :
                                  request.category === 'feature' ? 'badge-primary' :
                                    request.category === 'improvement' ? 'badge-secondary' :
                                      'badge-accent'
                                  }`}>
                                  {request.category}
                                </span>
                                <span className={`badge ${request.status === 'pending' ? 'badge-neutral' :
                                  request.status === 'reviewing' ? 'badge-warning' :
                                    request.status === 'approved' ? 'badge-success' :
                                      request.status === 'implemented' ? 'badge-info' :
                                        'badge-error'
                                  }`}>
                                  {request.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-base mb-2">{request.title}</h4>
                              <p className="text-sm text-base-content/80 mb-3">
                                {request.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-base-content/60">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  <span>{request.submittedBy?.fullName || 'Anonymous'}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="w-3 h-3" />
                                  <span>{request.upvotes} up</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-base-content/60">
                    <Zap className="w-20 h-20 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-semibold mb-2">No ideas yet!</p>
                    <p className="text-sm">Be the first to share your brilliant idea and help shape de_monax!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* App Overview with Logo */}
            <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl overflow-hidden">
              <div className="card-body text-center py-12">
                {/* App Logo */}
                <div className="mb-6 flex justify-center">
                  <div className="w-32 h-32 rounded-3xl bg-base-100 p-4 shadow-2xl">
                    <img
                      src={isDarkTheme(currentTheme) ? '/assets/lightlogo.png' : '/assets/darklogo.png'}
                      alt="de_monax Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* App Name */}
                <h1 className="text-4xl font-bold mb-2">de_monax</h1>
                <p className="text-lg text-primary-content/80 mb-6">Where Conversations Come Alive</p>

                <div className="divider divider-neutral opacity-30"></div>

                <p className="text-primary-content/90 max-w-2xl mx-auto leading-relaxed">
                  A modern, feature-rich communication platform built with cutting-edge technologies to provide seamless messaging, group chats, and social connectivity. Experience the future of digital communication.
                </p>

                {/* Version Badge */}
                <div className="mt-6 flex justify-center gap-2">
                  <div className="badge badge-lg bg-base-100 text-base-content border-base-300">
                    Version 1.0.0
                  </div>
                  <div className="badge badge-lg bg-base-100 text-base-content border-base-300">
                    Beta
                  </div>
                </div>
              </div>
            </div>

            {/* Mission & Vision */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-8 h-8 text-primary" />
                    <h3 className="card-title text-lg">Our Mission</h3>
                  </div>
                  <p className="text-sm text-base-content/70">
                    To create the most intuitive and reliable communication platform that connects people seamlessly, while continuously innovating and adapting to user needs.
                  </p>
                </div>
              </div>

              <div className="card bg-base-200 shadow-lg">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-8 h-8 text-secondary" />
                    <h3 className="card-title text-lg">Our Vision</h3>
                  </div>
                  <p className="text-sm text-base-content/70">
                    To become the leading communication platform that sets the standard for user experience, privacy, and innovation in social connectivity.
                  </p>
                </div>
              </div>
            </div>

            {/* Features Overview */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Powerful Features</h3>
                  <p className="text-sm text-base-content/60">Everything you need for seamless communication</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Real-time Messaging</h4>
                      <p className="text-xs text-base-content/70">Instant message delivery with typing indicators and read receipts</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-5 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border border-secondary/20 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Group Management</h4>
                      <p className="text-xs text-base-content/70">Create and manage groups with advanced permissions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-5 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Privacy & Security</h4>
                      <p className="text-xs text-base-content/70">Your data is protected with industry-standard encryption</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-5 bg-gradient-to-br from-warning/10 to-warning/5 rounded-xl border border-warning/20 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Lightning Fast</h4>
                      <p className="text-xs text-base-content/70">Optimized performance for instant responsiveness</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-5 bg-gradient-to-br from-error/10 to-error/5 rounded-xl border border-error/20 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-lg bg-error/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-error" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Community Driven</h4>
                      <p className="text-xs text-base-content/70">Built with user feedback and contributions</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-5 bg-gradient-to-br from-info/10 to-info/5 rounded-xl border border-info/20 hover:shadow-lg transition-all">
                    <div className="w-12 h-12 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
                      <Code className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Open Development</h4>
                      <p className="text-xs text-base-content/70">Transparent development process and roadmap</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Tech Stack */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="text-center mb-6">
                  <Code className="w-12 h-12 mx-auto mb-3 text-primary" />
                  <h3 className="text-xl font-bold mb-2">Built With Modern Technology</h3>
                  <p className="text-sm text-base-content/60">Powered by cutting-edge tools and frameworks</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-base-300 rounded-lg">
                    <div className="font-bold text-lg mb-1">React</div>
                    <div className="text-xs text-base-content/60">Frontend</div>
                  </div>
                  <div className="text-center p-4 bg-base-300 rounded-lg">
                    <div className="font-bold text-lg mb-1">Node.js</div>
                    <div className="text-xs text-base-content/60">Backend</div>
                  </div>
                  <div className="text-center p-4 bg-base-300 rounded-lg">
                    <div className="font-bold text-lg mb-1">Socket.IO</div>
                    <div className="text-xs text-base-content/60">Real-time</div>
                  </div>
                  <div className="text-center p-4 bg-base-300 rounded-lg">
                    <div className="font-bold text-lg mb-1">MongoDB</div>
                    <div className="text-xs text-base-content/60">Database</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Support */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body text-center py-10">
                <h3 className="text-2xl font-bold mb-3">Get In Touch</h3>
                <p className="mb-8 text-base-content/70 max-w-2xl mx-auto">
                  Have questions, suggestions, or need support? We'd love to hear from you!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
                  <div className="flex flex-col items-center gap-3 p-4 bg-base-300 rounded-lg">
                    <MessageSquare className="w-8 h-8 text-primary" />
                    <span className="font-semibold">Request Features</span>
                    <span className="text-xs text-base-content/60">Share your ideas</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-4 bg-base-300 rounded-lg">
                    <Heart className="w-8 h-8 text-error" />
                    <span className="font-semibold">Support Development</span>
                    <span className="text-xs text-base-content/60">Help us grow</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 p-4 bg-base-300 rounded-lg">
                    <Users className="w-8 h-8 text-secondary" />
                    <span className="font-semibold">Join Community</span>
                    <span className="text-xs text-base-content/60">Connect with others</span>
                  </div>
                </div>

                {/* Social Links */}
                <div className="mt-8 flex justify-center gap-4">
                  <a
                    href="https://discord.gg/sTQMkVsj9f"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-circle btn-primary"
                    title="Join our Discord"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </a>
                  <a
                    href="https://github.com/justelson"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-circle btn-ghost"
                    title="GitHub"
                  >
                    <Code className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Community Stats */}
            <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-xl">
              <div className="card-body text-center">
                <Users className="w-16 h-16 mx-auto mb-4" />
                <h2 className="card-title text-2xl justify-center">Join Our Growing Community</h2>
                <p className="text-primary-content/90">
                  Connect with other users, share feedback, and help us build something amazing together
                </p>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div>
                    <div className="text-3xl font-bold">{stats?.activeUsers?.toLocaleString() || '0'}</div>
                    <div className="text-sm opacity-80">Active Users</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats?.totalSupporters || '0'}</div>
                    <div className="text-sm opacity-80">Supporters</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{stats?.featuresBuilt || '12'}</div>
                    <div className="text-sm opacity-80">Features Built</div>
                  </div>
                </div>
              </div>
            </div>

            {/* New App Notice for Community */}
            <div className="alert alert-info shadow-lg">
              <div className="flex items-start gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div className="flex-1">
                  <h3 className="font-bold">Brand New Community! 🚀</h3>
                  <div className="text-sm">
                    {stats?.activeUsers > 0
                      ? `Our community is growing with ${stats.activeUsers.toLocaleString()} active users! Be part of our journey from the beginning.`
                      : "This app is just getting started! Be one of the first community members and help shape our growing platform."
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Community Links */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <h3 className="card-title mb-4">Connect With Us</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <a
                    href="https://discord.gg/sTQMkVsj9f"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary justify-start h-auto py-4 hover:scale-105 transition-transform"
                  >
                    <div className="flex flex-col items-center text-center w-full gap-2">
                      <MessageSquare className="w-6 h-6" />
                      <div className="font-semibold text-sm">Discord Community</div>
                      <div className="text-xs opacity-70">Chat with other users</div>
                    </div>
                  </a>
                  <a
                    href="https://github.com/justelson"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline justify-start h-auto py-4 hover:scale-105 transition-transform"
                  >
                    <div className="flex flex-col items-center text-center w-full gap-2">
                      <Star className="w-6 h-6" />
                      <div className="font-semibold text-sm">GitHub Repository</div>
                      <div className="text-xs opacity-70">Contribute to development</div>
                    </div>
                  </a>
                  <div className="card bg-base-300 border-2 border-dashed border-base-content/20">
                    <div className="card-body items-center text-center p-4">
                      <TrendingUp className="w-8 h-8 text-base-content/60 mb-2" />
                      <div className="font-semibold text-sm text-base-content/60">Public Roadmap</div>
                      <div className="text-xs opacity-70 mb-3">Coming Soon</div>
                      <div className="text-xs text-base-content/50">See what's coming next</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Early Adopter Benefits */}
            <div className="card bg-gradient-to-r from-accent to-info text-accent-content shadow-lg">
              <div className="card-body">
                <div className="flex items-center gap-3 mb-4">
                  <Gift className="w-8 h-8" />
                  <div>
                    <h3 className="card-title text-xl">Early Adopter Benefits</h3>
                    <p className="text-sm opacity-90">Be part of our founding community</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-1" />
                    <div>
                      <div className="font-semibold text-sm">Priority Support</div>
                      <div className="text-xs opacity-80">Get help first as a founding user</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-1" />
                    <div>
                      <div className="font-semibold text-sm">Shape the Future</div>
                      <div className="text-xs opacity-80">Your feedback directly influences development</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-1" />
                    <div>
                      <div className="font-semibold text-sm">Exclusive Badges</div>
                      <div className="text-xs opacity-80">Show off your early adopter status</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-success mt-1" />
                    <div>
                      <div className="font-semibold text-sm">Beta Features</div>
                      <div className="text-xs opacity-80">Early access to new functionality</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Supporters */}
            <div className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <Gift className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="card-title">Top Supporters</h3>
                      <p className="text-xs text-base-content/60">Our amazing contributors</p>
                    </div>
                  </div>
                  {stats?.recentDonations?.length > 0 && (
                    <span className="badge badge-secondary badge-sm">
                      {stats.recentDonations.length} supporter{stats.recentDonations.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {stats?.recentDonations?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {stats.recentDonations.map((supporter, idx) => (
                      <div key={supporter.id} className="card bg-base-300 shadow hover:shadow-lg transition-shadow">
                        <div className="card-body p-4">
                          <div className="flex items-center gap-3">
                            <div className="avatar placeholder">
                              <div className="bg-secondary text-secondary-content rounded-full w-12">
                                {supporter.avatar ? (
                                  <img src={supporter.avatar} alt={supporter.name} className="rounded-full" />
                                ) : (
                                  <span className="text-lg">{supporter.name[0]}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm truncate">{supporter.name}</div>
                              <div className="badge badge-secondary badge-xs">
                                {supporter.amount.toLocaleString()} TSh
                              </div>
                            </div>
                            {idx < 3 && (
                              <div className="text-2xl">
                                {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-base-content/60">
                    <Gift className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-semibold mb-2">No supporters yet</p>
                    <p className="text-sm">Be among the first to support and shape this project!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <ToastNotification toast={toast} />
    </div>
  );
}
