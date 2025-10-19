import { useEffect, useRef, useState, useCallback } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router";
import { LogOutIcon, Users, MessageSquare, Layers, Image, Trash2, Edit2, X, LayoutDashboard, Download, Search, FileText, Database, HardDrive, Camera, Megaphone, Bell, Edit, MessageCircle, ThumbsUp, CheckCircle, XCircle, Clock, RefreshCw, Menu, Settings, Crown, Info, Check } from "lucide-react";
import toast from "react-hot-toast";
import Avatar from "../components/Avatar";
import AnnouncementModal from "../components/AnnouncementModal";
import AppearanceModal from "../components/AppearanceModal";
import { useThemeStore } from "../store/useThemeStore";

// Utility function to format file sizes
function formatFileSize(bytes) {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function AdminPage() {
  const { authUser, logout, socket } = useAuthStore();
  const { openModal } = useThemeStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Debug logging
  useEffect(() => {
    const token = localStorage.getItem('jwt-token');
    const storedUser = localStorage.getItem('chat-user');
    console.log("🔍 AdminPage Debug:", {
      hasAuthUser: !!authUser,
      authUserRole: authUser?.role,
      hasToken: !!token,
      hasStoredUser: !!storedUser,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });
  }, [authUser]);

  // Swipe gesture state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Data states
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [groups, setGroups] = useState([]);
  const [communityGroups, setCommunityGroups] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Search and pagination state
  const [messagesQ, setMessagesQ] = useState("");
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesPerPage, setMessagesPerPage] = useState(50);

  const [groupsQ, setGroupsQ] = useState("");
  const [groupsPage, _setGroupsPage] = useState(1);
  const [groupsPerPage] = useState(50);

  const [uploads, setUploads] = useState([]);
  const [uploadsQ, setUploadsQ] = useState("");
  const [uploadsPage, setUploadsPage] = useState(1);
  const [uploadsTotal, setUploadsTotal] = useState(0);
  const [uploadsPerPage, setUploadsPerPage] = useState(50);

  const [posts, setPosts] = useState([]);
  const [postsQ, setPostsQ] = useState("");
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPerPage, setPostsPerPage] = useState(50);
  const [postsVisibility, setPostsVisibility] = useState("");

  const [announcements, setAnnouncements] = useState([]);

  // Modal states
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const [followLeaderboard, setFollowLeaderboard] = useState([]);
  const [followLeaderboardLimit, setFollowLeaderboardLimit] = useState(50);

  // Feature requests state
  const [featureRequests, setFeatureRequests] = useState([]);
  const [featureRequestsLoading, setFeatureRequestsLoading] = useState(false);

  // Messages subviews
  const [messagesSubTab, setMessagesSubTab] = useState('all'); // 'all' | 'conversations'
  const [conversations, setConversations] = useState([]);
  const [conversationsPage, setConversationsPage] = useState(1);
  const [conversationsPerPage, setConversationsPerPage] = useState(50);
  const [selectedConversation, setSelectedConversation] = useState(null); // {a, b}
  const [threadMessages, setThreadMessages] = useState([]);

  // Groups subviews
  const [groupsSubTab, setGroupsSubTab] = useState('all'); // 'all' | 'conversations'
  const [groupConversations, setGroupConversations] = useState([]);
  const [groupConvPage, setGroupConvPage] = useState(1);
  const [groupConvPerPage, setGroupConvPerPage] = useState(50);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupThreadMessages, setGroupThreadMessages] = useState([]);
  const [dmThreadQ, setDmThreadQ] = useState("");
  const [groupThreadQ, setGroupThreadQ] = useState("");

  // Simple in-memory cache with TTL (ms)
  const cacheRef = useRef(new Map());
  const fetchCached = useCallback(async (key, fetcher, ttl = 60000) => {
    const now = Date.now();
    const cached = cacheRef.current.get(key);
    if (cached && (now - cached.time) < ttl) {
      return cached.value;
    }
    const value = await fetcher();
    cacheRef.current.set(key, { time: now, value });
    return value;
  }, []);

  // Modal states
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);

  const onSelectConversation = useCallback(async (a, b) => {
    try {
      setSelectedConversation({ a, b });
      const res = await fetchCached(`dm_thread_${a}_${b}_${messagesPerPage}_${dmThreadQ}`, () => axiosInstance.get(`/api/admin/conversations/${a}/${b}?limit=${messagesPerPage}&q=${encodeURIComponent(dmThreadQ)}`), 60000);
      setThreadMessages(res.data || res || []);
    } catch {
      toast.error('Failed to load conversation');
    }
  }, [messagesPerPage, dmThreadQ, fetchCached]);

  const onSelectGroupConversation = useCallback(async (groupId) => {
    try {
      setSelectedGroup(groupId);
      const res = await fetchCached(`group_thread_${groupId}_${groupConvPerPage}_${groupThreadQ}`, () => axiosInstance.get(`/api/admin/group-conversations/${groupId}?limit=${groupConvPerPage}&q=${encodeURIComponent(groupThreadQ)}`), 60000);
      setGroupThreadMessages(res.data || res || []);
    } catch {
      toast.error('Failed to load group messages');
    }
  }, [groupConvPerPage, groupThreadQ, fetchCached]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        // Load all data for dashboard with caching
        const [overviewRes, usersRes, messagesRes, groupsRes, statusesRes, featureRequestsRes, groupConversationsRes] = await Promise.all([
          fetchCached('overview', () => axiosInstance.get('/api/admin/overview'), 30000),
          fetchCached('users', () => axiosInstance.get('/api/admin/users'), 60000),
          fetchCached('messages_10', () => axiosInstance.get('/api/admin/messages?limit=10'), 30000),
          fetchCached('groups', () => axiosInstance.get('/api/admin/groups'), 60000),
          fetchCached('statuses', () => axiosInstance.get('/api/admin/statuses'), 30000),
          fetchCached('feature_requests', () => axiosInstance.get('/api/feature-requests/admin/all'), 60000),
          fetchCached('group_conversations', () => axiosInstance.get('/api/admin/group-conversations?limit=50'), 30000)
        ]);
        setOverview(overviewRes.data);
        setUsers(usersRes.data);
        setMessages(messagesRes.data.messages || []);
        setGroups(groupsRes.data?.groups || []);
        setStatuses(statusesRes.data || []);
        setFeatureRequests(featureRequestsRes.data?.requests || []);
        setGroupConversations(groupConversationsRes.data || []);

        // Create recent activity from latest data
        const activities = [];
        messagesRes.data.messages?.slice(0, 5).forEach(m => {
          activities.push({ type: 'message', data: m, time: m.createdAt });
        });
        statusesRes.data?.slice(0, 3).forEach(s => {
          activities.push({ type: 'status', data: s, time: s.createdAt });
        });
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        setRecentActivity(activities.slice(0, 8));
      } else if (activeTab === "users") {
        const res = await fetchCached('users', () => axiosInstance.get('/api/admin/users'), 60000);
        setUsers(res.data || []);
      } else if (activeTab === "messages") {
        if (messagesSubTab === 'all') {
          const skip = (messagesPage - 1) * messagesPerPage;
          const res = await fetchCached(`messages_all_${messagesQ}_${messagesPage}`, () => axiosInstance.get(`/api/admin/messages?limit=${messagesPerPage}&skip=${skip}&q=${encodeURIComponent(messagesQ)}`), 15000);
          setMessages(res.data.messages || []);
        } else {
          const skip = (conversationsPage - 1) * conversationsPerPage;
          const res = await fetchCached(`dm_conversations_${conversationsPage}`, () => axiosInstance.get(`/api/admin/conversations?limit=${conversationsPerPage}&skip=${skip}`), 15000);
          setConversations(res.data || []);
          // Load first conversation automatically (use cached thread if available)
          if ((res.data || []).length > 0) {
            const c = res.data[0];
            onSelectConversation(c.sender._id, c.receiver._id);
          } else {
            setSelectedConversation(null);
            setThreadMessages([]);
          }
        }
      } else if (activeTab === "groups") {
        if (groupsSubTab === 'all') {
          const skip = (groupsPage - 1) * groupsPerPage;
          const res = await fetchCached(`groups_${groupsQ}_${groupsPage}`, () => axiosInstance.get(`/api/admin/groups?limit=${groupsPerPage}&skip=${skip}&q=${encodeURIComponent(groupsQ)}`), 30000);
          setGroups(res.data?.groups || []);
        } else {
          const skip = (groupConvPage - 1) * groupConvPerPage;
          const res = await fetchCached(`group_conversations_${groupConvPage}`, () => axiosInstance.get(`/api/admin/group-conversations?limit=${groupConvPerPage}&skip=${skip}`), 15000);
          setGroupConversations(res.data || []);
          if ((res.data || []).length > 0) {
            await onSelectGroupConversation(res.data[0].group._id);
          } else {
            setSelectedGroup(null);
            setGroupThreadMessages([]);
          }
        }
      } else if (activeTab === "posts") {
        const skip = (postsPage - 1) * postsPerPage;
        const res = await fetchCached(`posts_${postsQ}_${postsPage}_${postsVisibility}`, () => axiosInstance.get(`/api/admin/posts?limit=${postsPerPage}&skip=${skip}&q=${encodeURIComponent(postsQ)}&visibility=${postsVisibility}`), 15000);
        setPosts(res.data?.posts || []);
        setPostsTotal(res.data?.total || 0);
      } else if (activeTab === "uploads") {
        const skip = (uploadsPage - 1) * uploadsPerPage;
        const res = await fetchCached(`uploads_${uploadsQ}_${uploadsPage}`, () => axiosInstance.get(`/api/admin/uploads?limit=${uploadsPerPage}&skip=${skip}&q=${encodeURIComponent(uploadsQ)}`), 5000);
        setUploads(res.data?.uploads || []);
        setUploadsTotal(res.data?.total || 0);
      } else if (activeTab === "statuses") {
        const res = await fetchCached('statuses', () => axiosInstance.get('/api/admin/statuses'), 30000);
        setStatuses(res.data || []);
      } else if (activeTab === "announcements") {
        const res = await fetchCached('announcements', () => axiosInstance.get('/api/notices/announcements'), 30000);
        setAnnouncements(res.data || []);
      } else if (activeTab === "follow-leaderboard") {
        const res = await fetchCached(`follow_leaderboard_${followLeaderboardLimit}`, () => axiosInstance.get(`/api/admin/follow-leaderboard?limit=${followLeaderboardLimit}`), 30000);
        setFollowLeaderboard(res.data || []);
      } else if (activeTab === "community") {
        const res = await fetchCached('community_groups', () => axiosInstance.get('/api/admin/community-groups'), 30000);
        setCommunityGroups(res.data || []);
      } else if (activeTab === "feature-requests") {
        setFeatureRequestsLoading(true);
        try {
          const res = await axiosInstance.get('/api/feature-requests/admin/all');
          setFeatureRequests(res.data.requests || []);
        } catch (error) {
          console.error('Failed to load feature requests:', error);
          toast.error('Failed to load feature requests');
        } finally {
          setFeatureRequestsLoading(false);
        }
      }
    } catch (error) {
      console.error('Load error:', error);

      // Better error messages for production debugging
      if (!error.response) {
        toast.error("Cannot connect to server. Please check if the backend is running.");
      } else if (error.response.status === 401) {
        // Clear invalid token and redirect
        console.log("❌ 401 Unauthorized - clearing token and redirecting");
        localStorage.removeItem('jwt-token');
        localStorage.removeItem('chat-user');
        toast.error("Authentication failed. Please log in again.");
        navigate('/admin/login');
      } else if (error.response.status === 403) {
        toast.error("Access denied. Admin privileges required.");
      } else {
        toast.error("Failed to load data: " + (error.response?.data?.message || error.message));
      }
    }
    setLoading(false);
  }, [activeTab, fetchCached, messagesSubTab, messagesPage, messagesPerPage, messagesQ, conversationsPage, conversationsPerPage, onSelectConversation, groupsSubTab, groupsPage, groupsPerPage, groupsQ, groupConvPage, groupConvPerPage, onSelectGroupConversation, postsPage, postsPerPage, postsQ, postsVisibility, uploadsPage, uploadsPerPage, uploadsQ, followLeaderboardLimit, navigate]);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('jwt-token');

    if (!authUser && !token) {
      console.log("❌ No auth user and no token - redirecting to login");
      navigate('/admin/login');
      return;
    }

    if (!authUser && token) {
      console.log("⚠️ Token exists but no auth user - this might be a page refresh");
      // Don't redirect immediately, let the API calls try with the token
      // If they fail with 401, the loadData error handler will redirect
    }

    if (authUser && authUser.role !== 'admin') {
      console.log("❌ User is not admin");
      setLoading(false);
      return;
    }

    console.log("✅ Loading admin data...");
    loadData();
  }, [authUser, navigate, activeTab, messagesSubTab, groupsSubTab, messagesPage, groupsPage, conversationsPage, groupConvPage, postsPage, uploadsPage, messagesPerPage, groupsPerPage, conversationsPerPage, groupConvPerPage, postsPerPage, uploadsPerPage, followLeaderboardLimit, loadData]);



  // Live update via socket (debounced)
  useEffect(() => {
    if (!socket) return;
    let t = null;
    const schedule = () => {
      if (t) return;
      t = setTimeout(() => {
        t = null;
        loadData();
      }, 300);
    };
    socket.on('userUpdated', schedule);
    socket.on('newMessage', schedule);
    socket.on('newGroupMessage', schedule);
    socket.on('groupUpdated', schedule);
    socket.on('statusPosted', schedule);
    socket.on('messageUpdated', schedule);
    socket.on('profileUpdated', schedule);
    socket.on('featureRequest:statusUpdated', schedule);
    socket.on('featureRequest:deleted', schedule);
    return () => {
      socket.off('userUpdated', schedule);
      socket.off('newMessage', schedule);
      socket.off('newGroupMessage', schedule);
      socket.off('groupUpdated', schedule);
      socket.off('statusPosted', schedule);
      socket.off('messageUpdated', schedule);
      socket.off('profileUpdated', schedule);
      socket.off('featureRequest:statusUpdated', schedule);
      socket.off('featureRequest:deleted', schedule);
      if (t) clearTimeout(t);
    };
  }, [socket, activeTab, messagesSubTab, groupsSubTab, loadData]);

  useEffect(() => {
    const handler = async (e) => {
      const u = e.detail;
      const ok = window.confirm(`Delete ${u.kind} uploaded by ${u.user?.fullName || 'user'}?`);
      if (!ok) return;
      try {
        const payload = (function map() {
          if (u.kind === 'message-attachment') return { kind: u.kind, refId: u._id.split(':')[0], storageKey: u.storageKey };
          if (u.kind === 'message-image') return { kind: u.kind, refId: u._id.split(':')[0] };
          if (u.kind === 'status-media') return { kind: u.kind, refId: u.where?.id };
          if (u.kind === 'status-audio') return { kind: u.kind, refId: u.where?.id };
          return null;
        })();
        if (!payload) return;
        await axiosInstance.delete('/api/admin/uploads', { data: payload });
        toast.success('Upload deleted');
        loadData();
      } catch {
        toast.error('Failed to delete');
      }
    };
    window.addEventListener('admin:deleteUpload', handler);
    return () => window.removeEventListener('admin:deleteUpload', handler);
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteModal) return;
    try {
      // Special handling for announcements
      if (deleteModal.type === 'announcements') {
        await axiosInstance.delete(`/api/notices/announcements/${deleteModal.id}`);
      }
      // Special handling for feature requests
      else if (deleteModal.type === 'feature-requests') {
        await axiosInstance.delete(`/api/feature-requests/admin/feature-requests/${deleteModal.id}`);
      } else {
        await axiosInstance.delete(`/api/admin/${deleteModal.type}/${deleteModal.id}`);
      }
      toast.success(`${deleteModal.type.slice(0, -1)} deleted successfully`);
      setDeleteModal(null);
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error("Failed to delete: " + (error.response?.data?.message || error.message));
    }
  };



  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editModal) return;
    try {
      await axiosInstance.patch(`/api/admin/${editModal.type}/${editModal.id}`, editModal.data);
      toast.success("Updated successfully");
      setEditModal(null);
      loadData();
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleModalSuccess = () => {
    // Refresh the announcements data
    loadData();
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setIsAnnouncementModalOpen(true);
  };

  const handleEditSuccess = () => {
    // Refresh the announcements data
    loadData();
    setEditingAnnouncement(null);
  };

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Swipe from left edge to open sidebar
    if (isRightSwipe && touchStart < 50 && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }

    // Swipe left to close sidebar
    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  if (!authUser) return null;

  if (authUser.role !== 'admin') {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-base-300">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-error">Access Denied</h2>
            <p className="text-base-content/60">You don't have admin privileges.</p>
            <div className="card-actions justify-end">
              <button className="btn btn-primary" onClick={() => navigate('/')}>Back to App</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "groups", label: "Groups", icon: Layers },
    { id: "community", label: "Community", icon: Users },
    { id: "posts", label: "Posts", icon: FileText },
    { id: "feature-requests", label: "Feature Requests", icon: MessageCircle },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "follow-leaderboard", label: "Follow Leaders", icon: Users },
    { id: "uploads", label: "Uploads", icon: Download },
    { id: "statuses", label: "Statuses", icon: Image },
  ];

  return (
    <div
      className="w-full h-screen bg-base-300 flex overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-64 bg-base-100 border-r border-base-300 flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-base-content">Admin Panel</h1>
              <button
                className="btn btn-xs btn-ghost btn-circle"
                title="Appearance & Customization"
                onClick={() => openModal()}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            {/* Close button for mobile */}
            <button
              className="btn btn-sm btn-ghost btn-circle lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-base-content/60 mt-1">Logged in as: {authUser?.email}</p>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false); // Close sidebar on mobile
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                    ? "bg-primary text-primary-content"
                    : "text-base-content hover:bg-base-200"
                    }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-base-300 space-y-2">
          <a
            href="https://justelson-help.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-ghost w-full justify-start gap-2"
          >
            <span className="text-xs">Support</span>
          </a>
          <button className="btn btn-sm btn-ghost w-full justify-start gap-2" onClick={() => navigate('/')}>
            <span className="text-xs">Back to App</span>
          </button>
          <button
            className="btn btn-sm btn-error w-full justify-start gap-2"
            onClick={() => { logout(); navigate('/admin/login'); }}
          >
            <LogOutIcon className="w-4 h-4" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-base-100 border-b border-base-300 px-3 md:px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                className="btn btn-sm btn-ghost btn-circle lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                title="Open Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <h2 className="text-base md:text-lg font-semibold text-base-content">
                  {tabs.find(tab => tab.id === activeTab)?.label || 'Dashboard'}
                </h2>
                <p className="text-xs md:text-sm text-base-content/60 hidden sm:block">
                  Manage and monitor your application
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="btn btn-sm btn-ghost gap-2"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-6">
            {loading ? (
              <LoadingSkeleton activeTab={activeTab} />
            ) : (
              <>
                {activeTab === "dashboard" && <DashboardView overview={overview} users={users} messages={messages} groups={groups} statuses={statuses} recentActivity={recentActivity} featureRequests={featureRequests} groupConversations={groupConversations} />}
                {activeTab === "users" && <UsersView users={users} setEditModal={setEditModal} setDeleteModal={setDeleteModal} />}
                {activeTab === "messages" && (
                  <MessagesView
                    messagesSubTab={messagesSubTab}
                    setMessagesSubTab={setMessagesSubTab}
                    messages={messages}
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    threadMessages={threadMessages}
                    onSelectConversation={onSelectConversation}
                    setEditModal={setEditModal}
                    setDeleteModal={setDeleteModal}
                    q={messagesQ}
                    setQ={setMessagesQ}
                    page={messagesPage}
                    setPage={setMessagesPage}
                    perPage={messagesPerPage}
                    setPerPage={setMessagesPerPage}
                    convPage={conversationsPage}
                    setConvPage={setConversationsPage}
                    convPerPage={conversationsPerPage}
                    setConvPerPage={setConversationsPerPage}
                    dmThreadQ={dmThreadQ}
                    setDmThreadQ={setDmThreadQ}
                    loading={loading}
                  />
                )}
                {activeTab === "groups" && (
                  <GroupsView
                    groups={groups}
                    setEditModal={setEditModal}
                    setDeleteModal={setDeleteModal}
                    groupsSubTab={groupsSubTab}
                    setGroupsSubTab={setGroupsSubTab}
                    groupConversations={groupConversations}
                    selectedGroup={selectedGroup}
                    groupThreadMessages={groupThreadMessages}
                    onSelectGroupConversation={onSelectGroupConversation}
                    q={groupsQ}
                    setQ={setGroupsQ}
                    page={groupsPage}
                    setPage={_setGroupsPage}
                    perPage={groupsPerPage}
                    convPage={groupConvPage}
                    setConvPage={setGroupConvPage}
                    convPerPage={groupConvPerPage}
                    setConvPerPage={setGroupConvPerPage}
                    loading={loading}
                    groupThreadQ={groupThreadQ}
                    setGroupThreadQ={setGroupThreadQ}
                  />
                )}
                {activeTab === "community" && (
                  <CommunityGroupsView
                    communityGroups={communityGroups}
                    loading={loading}
                    onRefresh={loadData}
                  />
                )}
                {activeTab === "posts" && (
                  <PostsView
                    posts={posts}
                    q={postsQ}
                    setQ={setPostsQ}
                    page={postsPage}
                    setPage={setPostsPage}
                    perPage={postsPerPage}
                    setPerPage={setPostsPerPage}
                    total={postsTotal}
                    visibility={postsVisibility}
                    setVisibility={setPostsVisibility}
                    onRefresh={loadData}
                    loading={loading}
                    setDeleteModal={setDeleteModal}
                  />
                )}
                {activeTab === "uploads" && (
                  <UploadsView
                    uploads={uploads}
                    q={uploadsQ}
                    setQ={setUploadsQ}
                    page={uploadsPage}
                    setPage={setUploadsPage}
                    perPage={uploadsPerPage}
                    setPerPage={setUploadsPerPage}
                    total={uploadsTotal}
                    onRefresh={loadData}
                    loading={loading}
                  />
                )}
                {activeTab === "statuses" && <StatusesView statuses={statuses} setDeleteModal={setDeleteModal} />}
                {activeTab === "announcements" && (
                  <AnnouncementsView
                    announcements={announcements}
                    onRefresh={loadData}
                    setDeleteModal={setDeleteModal}
                    isAnnouncementModalOpen={isAnnouncementModalOpen}
                    setIsAnnouncementModalOpen={setIsAnnouncementModalOpen}
                    onEditAnnouncement={handleEditAnnouncement}
                  />
                )}
                {activeTab === "follow-leaderboard" && (
                  <FollowLeaderboardView
                    leaderboard={followLeaderboard}
                    limit={followLeaderboardLimit}
                    setLimit={setFollowLeaderboardLimit}
                    onRefresh={loadData}
                    loading={loading}
                  />
                )}
                {activeTab === "feature-requests" && (
                  <FeatureRequestsView
                    requests={featureRequests}
                    loading={featureRequestsLoading}
                    onRefresh={loadData}
                    setDeleteModal={setDeleteModal}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <EditModal editModal={editModal} setEditModal={setEditModal} handleUpdate={handleUpdate} />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <DeleteModal deleteModal={deleteModal} setDeleteModal={setDeleteModal} handleDelete={handleDelete} />
      )}

      {/* Announcement Modal */}
      <AnnouncementModal
        isOpen={isAnnouncementModalOpen}
        onClose={() => {
          setIsAnnouncementModalOpen(false);
          setEditingAnnouncement(null);
        }}
        onSuccess={editingAnnouncement ? handleEditSuccess : handleModalSuccess}
        initialData={editingAnnouncement}
        isEditing={!!editingAnnouncement}
      />

      {/* Appearance/Customization Modal */}
      <AppearanceModal />
    </div>
  );
}

// Loading Skeleton Component
function LoadingSkeleton({ activeTab }) {
  // Dashboard skeleton
  if (activeTab === "dashboard") {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-2"></div>
            <div className="skeleton h-4 w-64"></div>
          </div>
        </div>

        {/* Stats grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow">
              <div className="card-body p-3 md:p-6">
                <div className="skeleton h-4 w-20 mb-2"></div>
                <div className="skeleton h-8 w-16 mb-2"></div>
                <div className="skeleton h-3 w-24"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow">
              <div className="card-body">
                <div className="skeleton h-5 w-32 mb-4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="skeleton h-12 w-full"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Users skeleton
  if (activeTab === "users") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-2"></div>
            <div className="skeleton h-4 w-64"></div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4 md:p-6">
              <div className="flex items-center gap-4">
                <div className="skeleton w-16 h-16 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48"></div>
                  <div className="skeleton h-4 w-64"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Messages skeleton
  if (activeTab === "messages") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
            <div className="flex gap-2 mb-4">
              <div className="skeleton h-10 w-24"></div>
              <div className="skeleton h-10 w-32"></div>
            </div>
          </div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-full"></div>
                  <div className="skeleton h-3 w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Groups skeleton
  if (activeTab === "groups") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Posts skeleton
  if (activeTab === "posts") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-full"></div>
                  <div className="flex-1">
                    <div className="skeleton h-4 w-32 mb-2"></div>
                    <div className="skeleton h-3 w-24"></div>
                  </div>
                </div>
                <div className="skeleton h-20 w-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Uploads skeleton
  if (activeTab === "uploads") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Statuses skeleton
  if (activeTab === "statuses") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
              </div>
              <div className="skeleton h-32 w-full mt-3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Announcements skeleton
  if (activeTab === "announcements") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="skeleton h-5 w-64 mb-3"></div>
              <div className="skeleton h-16 w-full mb-2"></div>
              <div className="skeleton h-3 w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Feature requests skeleton
  if (activeTab === "feature-requests") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-start gap-3">
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-full"></div>
                  <div className="skeleton h-4 w-3/4"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Follow leaderboard skeleton
  if (activeTab === "follow-leaderboard") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-base-300 last:border-0">
                <div className="skeleton w-8 h-8 rounded-full"></div>
                <div className="skeleton w-10 h-10 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32"></div>
                  <div className="skeleton h-3 w-24"></div>
                </div>
                <div className="skeleton h-6 w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Community skeleton
  if (activeTab === "community") {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <div className="skeleton h-6 w-48 mb-4"></div>
          </div>
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-16 h-16 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-48"></div>
                  <div className="skeleton h-4 w-full"></div>
                  <div className="skeleton h-3 w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="flex justify-center py-12">
      <span className="loading loading-spinner loading-lg"></span>
    </div>
  );
}

// Dashboard View
function DashboardView({ overview, users, messages, groups, statuses, recentActivity, featureRequests = [], groupConversations = [] }) {
  if (!overview) return null;

  // Calculate additional stats
  const activeUsers = users.filter(u => !u.isBanned).length;
  const todayMessages = messages.filter(m => {
    const msgDate = new Date(m.createdAt);
    const today = new Date();
    return msgDate.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Dashboard Overview</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">System statistics and performance metrics</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Avg Messages/User</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{users.length ? Math.round(overview.messages / users.length) : 0}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Avg Group Size</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{groups.length ? Math.round(groups.reduce((acc, g) => acc + (g.members?.length || 0), 0) / groups.length) : 0}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Messages Today</div>
                  <div className="stat-value text-sm md:text-lg text-accent">{todayMessages}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">New Users (7d)</div>
                  <div className="stat-value text-sm md:text-lg text-info">{users.filter(u => new Date(u.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}</div>
                </div>
              </div>
              <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('dashboard-overview.csv', [overview], [
                { key: 'users', label: 'Users' }, { key: 'groups', label: 'Groups' }, { key: 'messages', label: 'Messages' }, { key: 'activeStatuses', label: 'Active Statuses' }
              ])}>
                <span className="text-xs md:text-sm">Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <StatCard title="Total Users" value={overview.users} subtitle={`${activeUsers} active`} color="text-info" icon={Users} />
        <StatCard title="Total Groups" value={overview.groups} subtitle={`${groups.filter(g => g.members?.length > 5).length} large groups`} color="text-success" icon={Layers} />
        <StatCard title="Total Messages" value={overview.messages} subtitle={`${todayMessages} today`} color="text-secondary" icon={MessageSquare} />
        <StatCard title="Active Statuses" value={overview.activeStatuses} subtitle={`${statuses.length} total`} color="text-accent" icon={Image} />
        <StatCard title="Database Size" value={formatFileSize(overview.databaseSize)} subtitle="MongoDB data" color="text-primary" icon={Database} />
        <StatCard title="Storage Size" value={formatFileSize(overview.storageSize)} subtitle="Media files" color="text-warning" icon={HardDrive} />
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Top Groups */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Top Groups</h3>
            <div className="space-y-2">
              {groups.sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0)).slice(0, 3).map(group => (
                <div key={group._id} className="flex items-center gap-2">
                  <Avatar
                    src={group.groupPic}
                    name={group.name}
                    alt={group.name}
                    size="w-8 h-8"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{group.name}</p>
                    <p className="text-xs text-base-content/60">{group.members?.length || 0} members</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Data Cleanup */}
        <CleanupCard />

        {/* Recent Activity */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Recent Activity</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {recentActivity.map((activity, i) => (
                <div key={i} className="text-sm">
                  {activity.type === 'message' ? (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-xs">
                        <strong className={!activity.data.senderId?.fullName ? 'italic text-base-content/50' : ''}>
                          {activity.data.senderId?.fullName || 'Deleted User'}
                        </strong> sent a message
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs">
                        <strong>{activity.data.userId?.fullName || 'Unknown'}</strong> posted a status
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Group Preview with Messages */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Group Activity</h3>
            <div className="space-y-3">
              {groups.slice(0, 4).map(group => {
                // Find message count from groupConversations
                const groupConv = groupConversations.find(gc => gc.group?._id === group._id);
                const messageCount = groupConv?.count || 0;

                return (
                  <div key={group._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Avatar
                        src={group.groupPic}
                        name={group.name}
                        size="w-8 h-8"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{group.name}</p>
                        <p className="text-xs text-base-content/60">
                          {group.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-base-content/60">
                      <MessageSquare className="w-3 h-3" />
                      <span>{messageCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Storage Distribution */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Storage Distribution</h3>
            <div className="space-y-4">
              {/* MongoDB */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">MongoDB</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {formatFileSize(overview.databaseSize || 0)}
                  </span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${((overview.databaseSize || 0) / ((overview.databaseSize || 0) + (overview.storageSize || 0)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-base-content/60 mt-1">
                  {(((overview.databaseSize || 0) / ((overview.databaseSize || 0) + (overview.storageSize || 0)) * 100) || 0).toFixed(1)}% of total
                </p>
              </div>

              {/* Supabase */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">Supabase</span>
                  </div>
                  <span className="text-sm font-bold text-warning">
                    {formatFileSize(overview.storageSize || 0)}
                  </span>
                </div>
                <div className="w-full bg-base-300 rounded-full h-2">
                  <div
                    className="bg-warning h-2 rounded-full transition-all"
                    style={{
                      width: `${((overview.storageSize || 0) / ((overview.databaseSize || 0) + (overview.storageSize || 0)) * 100) || 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-base-content/60 mt-1">
                  {(((overview.storageSize || 0) / ((overview.databaseSize || 0) + (overview.storageSize || 0)) * 100) || 0).toFixed(1)}% of total
                </p>
              </div>

              {/* Total */}
              <div className="pt-2 border-t border-base-300">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total Storage</span>
                  <span className="text-sm font-bold text-info">
                    {formatFileSize((overview.databaseSize || 0) + (overview.storageSize || 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Requests */}
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-sm">Feature Requests</h3>
            <div className="space-y-3">
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Total Requests</div>
                <div className="stat-value text-2xl text-primary">{featureRequests.length}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                    <span className="text-xs text-base-content/60">Pending</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'pending').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-info"></div>
                    <span className="text-xs text-base-content/60">Reviewing</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'reviewing').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-xs text-base-content/60">Approved</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'approved').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success"></div>
                    <span className="text-xs text-base-content/60">Implemented</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'implemented').length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-error"></div>
                    <span className="text-xs text-base-content/60">Denied</span>
                  </div>
                  <span className="text-sm font-medium">
                    {featureRequests.filter(r => r.status === 'denied').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function StatCard({ title, value, subtitle, color, icon: Icon }) {
  return (
    <div className="card bg-base-100 text-base-content shadow hover:shadow-lg transition-shadow">
      <div className="card-body p-3 md:p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="text-xs md:text-sm text-base-content/60 leading-tight">{title}</div>
          {Icon && <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color} opacity-50 flex-shrink-0`} />}
        </div>
        <div className={`text-lg md:text-3xl font-bold ${color} leading-tight`}>{value}</div>
        {subtitle && <div className="text-xs text-base-content/50 mt-1 leading-tight">{subtitle}</div>}
      </div>
    </div>
  );
}

// Cleanup Card Component
function CleanupCard() {
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

// Users View
function UsersView({ users, setEditModal, setDeleteModal }) {
  const [expandedUsers, setExpandedUsers] = useState(new Set());

  const toggleExpanded = (userId) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Users Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage user accounts and permissions</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Users</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{users.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Active Users</div>
                  <div className="stat-value text-sm md:text-lg text-success">{users.filter(u => !u.isBanned).length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Admins</div>
                  <div className="stat-value text-sm md:text-lg text-warning">{users.filter(u => u.role === 'admin').length}</div>
                </div>
              </div>
              <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('users.csv', users, [
                { label: 'Name', value: r => r.fullName },
                { label: 'Email', value: r => r.email },
                { label: 'Role', value: r => r.role },
                { label: 'Status', value: r => r.isBanned ? 'Banned' : 'Active' },
                { label: 'Joined', value: r => new Date(r.createdAt).toISOString() }
              ])}>
                <span className="text-xs md:text-sm">Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {users.map((user) => {
          const isExpanded = expandedUsers.has(user._id);
          return (
            <div key={user._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
              <div className="card-body p-4 md:p-6">
                {/* Basic User Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="avatar flex-shrink-0">
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-full">
                        <img src={user.profilePic || '/avatar.png'} alt="" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="font-semibold text-base md:text-lg truncate">{user.fullName}</h3>
                        <div className="flex gap-2">
                          <div className={`badge badge-sm md:badge-lg ${user.role === 'admin' ? 'badge-error' : 'badge-ghost'}`}>
                            {user.role.toUpperCase()}
                          </div>
                          <div className={`badge badge-sm md:badge-lg ${user.isBanned ? 'badge-error' : 'badge-success'}`}>
                            {user.isBanned ? 'BANNED' : 'ACTIVE'}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm md:text-base text-base-content/70 mb-1 truncate">{user.email}</div>
                      <div className="text-xs md:text-sm text-base-content/60">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                        <span className="hidden sm:inline"> at {new Date(user.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      className="btn btn-xs md:btn-sm btn-ghost"
                      onClick={() => toggleExpanded(user._id)}
                    >
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                    <button
                      className="btn btn-xs md:btn-sm btn-outline"
                      onClick={() => setEditModal({
                        type: 'users',
                        id: user._id,
                        data: {
                          fullName: user.fullName,
                          email: user.email,
                          role: user.role,
                          isBanned: user.isBanned
                        }
                      })}
                    >
                      <Edit2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Edit</span>
                    </button>
                    <button
                      className="btn btn-xs md:btn-sm btn-error btn-outline"
                      onClick={() => setDeleteModal({ type: 'users', id: user._id, name: user.fullName })}
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 md:mt-6 pt-4 border-t border-base-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {/* Account Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content/80">Account Details</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">User ID:</span> {user._id}</div>
                          <div><span className="font-medium">Full Name:</span> {user.fullName}</div>
                          <div><span className="font-medium">Email:</span> {user.email}</div>
                          <div><span className="font-medium">Role:</span> {user.role}</div>
                        </div>
                      </div>

                      {/* Status Information */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content/80">Status Information</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Account Status:</span> {user.isBanned ? 'Banned' : 'Active'}</div>
                          <div><span className="font-medium">Last Login:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</div>
                          <div><span className="font-medium">Email Verified:</span> {user.isVerified ? 'Yes' : 'No'}</div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content/80">Timestamps</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="font-medium">Created:</span> {new Date(user.createdAt).toLocaleString()}</div>
                          <div><span className="font-medium">Updated:</span> {new Date(user.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {users.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-base-content/40" />
              </div>
              <div className="text-lg font-medium">No users found</div>
              <div className="text-base-content/60 mt-2">There are no users to display</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Messages View with sub-tabs
function MessagesView({ messagesSubTab, setMessagesSubTab, messages, conversations, selectedConversation, threadMessages, onSelectConversation, setEditModal, setDeleteModal, q, setQ, page, setPage, perPage, setPerPage, convPage, setConvPage, convPerPage, setConvPerPage, dmThreadQ, setDmThreadQ, loading }) {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle individual message selection
  const toggleMessageSelection = (msgId) => {
    setSelectedMessages(prev =>
      prev.includes(msgId)
        ? prev.filter(id => id !== msgId)
        : [...prev, msgId]
    );
  };

  // Select all messages
  const selectAllMessages = () => {
    if (messagesSubTab === 'conversations' && threadMessages.length > 0) {
      setSelectedMessages(threadMessages.map(m => m._id));
    } else if (messagesSubTab === 'all' && messages.length > 0) {
      setSelectedMessages(messages.map(m => m._id));
    }
  };

  // Deselect all messages
  const deselectAllMessages = () => {
    setSelectedMessages([]);
  };

  // Bulk delete selected messages
  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''}? This action cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedMessages.map(id => axiosInstance.delete(`/api/admin/messages/${id}`))
      );
      toast.success(`Successfully deleted ${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''}`);
      setSelectedMessages([]);
      // Reload the conversation or messages
      if (selectedConversation) {
        onSelectConversation(selectedConversation.a, selectedConversation.b);
      }
      window.location.reload(); // Simple reload to refresh data
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some messages');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear selection when switching tabs or conversations
  useEffect(() => {
    setSelectedMessages([]);
  }, [messagesSubTab, selectedConversation]);

  const currentMessages = messagesSubTab === 'conversations' ? threadMessages : messages;
  const allSelected = currentMessages.length > 0 && selectedMessages.length === currentMessages.length;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Messages Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage direct messages and conversations</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Messages</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{messages.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Conversations</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{conversations.length}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedMessages.length > 0 && (
                  <>
                    <div className="badge badge-primary gap-2">
                      <span className="text-xs">{selectedMessages.length} selected</span>
                    </div>
                    <button
                      className="btn btn-sm btn-error gap-2"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span className="text-xs">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">Delete Selected</span>
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-sm btn-ghost gap-2"
                      onClick={deselectAllMessages}
                    >
                      <X className="w-4 h-4" />
                      <span className="text-xs">Clear</span>
                    </button>
                  </>
                )}
                {messagesSubTab === 'all' && (
                  <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('messages.csv', messages, [
                    { label: 'Sender', value: r => r.senderId?.fullName || '' },
                    { label: 'Receiver', value: r => r.receiverId?.fullName || '' },
                    { label: 'Text', value: r => r.text || '' },
                    { label: 'Timestamp', value: r => new Date(r.createdAt).toISOString() }
                  ])}>
                    <span className="text-xs md:text-sm">Export CSV</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-base-300">
            <div className="tabs tabs-boxed">
              <button
                className={`tab tab-sm md:tab-md ${messagesSubTab === 'all' ? 'tab-active' : ''}`}
                onClick={() => setMessagesSubTab('all')}
              >
                <span className="text-xs md:text-sm">All Messages</span>
              </button>
              <button
                className={`tab tab-sm md:tab-md ${messagesSubTab === 'conversations' ? 'tab-active' : ''}`}
                onClick={() => setMessagesSubTab('conversations')}
              >
                <span className="text-xs md:text-sm">Conversations</span>
              </button>
            </div>

            {messagesSubTab === 'all' && (
              <div className="form-control">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                  <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    className="input input-sm input-bordered pl-9 pr-4 w-full"
                    placeholder="Search messages..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {messagesSubTab === 'all' ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-2 md:p-4">
            {loading && (
              <div className="px-4 pb-2">
                <div className="animate-pulse text-xs opacity-60">Loading messages...</div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="form-control">
                <label className="label cursor-pointer gap-2">
                  <span className="label-text text-xs">Per page</span>
                  <select className="select select-xs select-bordered" value={perPage} onChange={(e) => { setPage(1); setPerPage(Number(e.target.value)); }}>
                    <option value={50}>50</option>
                    <option value={75}>75</option>
                  </select>
                </label>
              </div>
              <div className="join">
                <button className="join-item btn btn-xs" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                <button className="join-item btn btn-xs" onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table table-zebra w-full text-sm">
                <thead>
                  <tr>
                    <th className="w-12">
                      <label>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={allSelected}
                          onChange={(e) => e.target.checked ? selectAllMessages() : deselectAllMessages()}
                        />
                      </label>
                    </th>
                    <th className="w-20">Avatar</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Message</th>
                    <th>Time</th>
                    <th className="w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
                    <tr key={msg._id} className="hover">
                      <td>
                        <label>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedMessages.includes(msg._id)}
                            onChange={() => toggleMessageSelection(msg._id)}
                          />
                        </label>
                      </td>
                      <td>
                        <div className="avatar">
                          <div className="w-8 h-8 rounded-full">
                            <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                          </div>
                        </div>
                      </td>
                      <td className={`font-medium ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                        {msg.senderId?.fullName || 'Deleted User'}
                      </td>
                      <td className={`font-medium ${!msg.receiverId?.fullName ? 'italic text-base-content/50' : ''}`}>
                        {msg.receiverId?.fullName || 'Deleted User'}
                      </td>
                      <td className="max-w-md">
                        <div className="truncate">
                          {msg.text || msg.image ? (
                            <>
                              {msg.text}
                              {msg.image && <span className="badge badge-primary badge-sm ml-1">Image</span>}
                            </>
                          ) : msg.attachments?.length > 0 ? (
                            <span className="badge badge-secondary badge-sm">{msg.attachments.length} Attachment(s)</span>
                          ) : msg.audio ? (
                            <span className="badge badge-accent badge-sm">Voice Message</span>
                          ) : (
                            <span className="text-base-content/40">[No text content]</span>
                          )}
                        </div>
                      </td>
                      <td className="text-xs text-base-content/70">
                        <div>{new Date(msg.createdAt).toLocaleDateString()}</div>
                        <div>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {msg.text && (
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            className="btn btn-xs btn-error btn-outline"
                            onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2">
              {messages.map((msg) => (
                <div key={msg._id} className={`card shadow-sm ${selectedMessages.includes(msg._id) ? 'bg-primary/10 border-2 border-primary' : 'bg-base-200'}`}>
                  <div className="card-body p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <label>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedMessages.includes(msg._id)}
                          onChange={() => toggleMessageSelection(msg._id)}
                        />
                      </label>
                      <div className="avatar">
                        <div className="w-6 h-6 rounded-full">
                          <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                          {msg.senderId?.fullName || 'Deleted User'}
                        </div>
                        <div className="text-xs text-base-content/60">
                          To: <span className={!msg.receiverId?.fullName ? 'italic text-base-content/50' : ''}>
                            {msg.receiverId?.fullName || 'Deleted User'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-base-content/60">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-sm text-base-content/80 mb-2">
                      {msg.text || msg.image ? (
                        <>
                          {msg.text}
                          {msg.image && <span className="badge badge-primary badge-sm ml-1">Image</span>}
                        </>
                      ) : msg.attachments?.length > 0 ? (
                        <span className="badge badge-secondary badge-sm">{msg.attachments.length} Attachment(s)</span>
                      ) : msg.audio ? (
                        <span className="badge badge-accent badge-sm">Voice Message</span>
                      ) : (
                        <span className="text-base-content/40">[No text content]</span>
                      )}
                    </div>

                    <div className="flex gap-1 justify-end">
                      {msg.text && (
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                        >
                          <Edit2 className="w-3 h-3" />
                          <span className="text-xs">Edit</span>
                        </button>
                      )}
                      <button
                        className="btn btn-xs btn-error btn-outline"
                        onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span className="text-xs">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-2 md:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[70vh]">
              {/* Conversations list */}
              <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-base-300 pr-0 lg:pr-4 pb-4 lg:pb-0 flex flex-col max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 mb-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs">Per page</span>
                    </label>
                    <select className="select select-sm select-bordered" value={convPerPage} onChange={(e) => { setConvPage(1); setConvPerPage(Number(e.target.value)); }}>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="join">
                    <button className="join-item btn btn-sm" disabled={convPage <= 1} onClick={() => setConvPage(p => Math.max(1, p - 1))}>Prev</button>
                    <button className="join-item btn btn-sm" onClick={() => setConvPage(p => p + 1)} disabled={conversations.length < convPerPage}>Next</button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No conversations found</p>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {conversations.map((c, idx) => {
                      const isActive = selectedConversation &&
                        ((selectedConversation.a === c.sender._id && selectedConversation.b === c.receiver._id) ||
                          (selectedConversation.a === c.receiver._id && selectedConversation.b === c.sender._id));

                      return (
                        <button
                          key={idx}
                          className={`w-full p-3 rounded-lg transition-all hover:bg-base-200 text-left ${isActive ? 'bg-primary/10 border-2 border-primary' : 'bg-base-100 border-2 border-transparent'
                            }`}
                          onClick={() => onSelectConversation(c.sender._id, c.receiver._id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatars */}
                            <div className="avatar-group -space-x-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full ring ring-base-100">
                                  <img src={c.sender.profilePic || '/avatar.png'} alt={c.sender.fullName} />
                                </div>
                              </div>
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full ring ring-base-100">
                                  <img src={c.receiver.profilePic || '/avatar.png'} alt={c.receiver.fullName} />
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="text-sm font-semibold truncate">
                                  {c.sender.fullName} & {c.receiver.fullName}
                                </div>
                                <span className="badge badge-primary badge-sm flex-shrink-0">{c.count || 0}</span>
                              </div>

                              <div className="text-xs text-base-content/60 mb-1">
                                {c.sender.email} ↔ {c.receiver.email}
                              </div>

                              {c.lastMessage && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="text-xs text-base-content/70 truncate flex-1">
                                    <span className="font-medium">{c.lastMessage.senderId?.fullName || 'User'}:</span>{' '}
                                    {c.lastMessage.text || '[media]'}
                                  </div>
                                  <div className="text-xs text-base-content/50 flex-shrink-0">
                                    {new Date(c.lastMessage.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Thread messages */}
              <div className="lg:col-span-2 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Search bar */}
                    <div className="mb-4">
                      <div className="form-control">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                          <input
                            value={dmThreadQ}
                            onChange={(e) => {
                              setDmThreadQ(e.target.value);
                              if (selectedConversation) onSelectConversation(selectedConversation.a, selectedConversation.b);
                            }}
                            className="input input-sm input-bordered pl-9 pr-4 w-full"
                            placeholder="Search in conversation..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Messages count */}
                    {threadMessages.length > 0 && (
                      <div className="mb-3 text-xs text-base-content/60 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''} in this conversation</span>
                      </div>
                    )}

                    {/* Desktop Table View */}
                    <div className="hidden md:block flex-1 overflow-y-auto max-h-[70vh]">
                      {threadMessages.length === 0 ? (
                        <div className="text-center py-12 text-base-content/60">
                          <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No messages found</p>
                        </div>
                      ) : (
                        <table className="table table-zebra w-full text-sm">
                          <thead className="sticky top-0 bg-base-100 z-10">
                            <tr>
                              <th className="w-12">
                                <label>
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={allSelected}
                                    onChange={(e) => e.target.checked ? selectAllMessages() : deselectAllMessages()}
                                  />
                                </label>
                              </th>
                              <th className="w-16">Avatar</th>
                              <th className="w-32">From</th>
                              <th>Message</th>
                              <th className="w-40">Time</th>
                              <th className="w-24">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {threadMessages.map((msg) => (
                              <tr key={msg._id} className="hover">
                                <td>
                                  <label>
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-sm"
                                      checked={selectedMessages.includes(msg._id)}
                                      onChange={() => toggleMessageSelection(msg._id)}
                                    />
                                  </label>
                                </td>
                                <td>
                                  <div className="avatar">
                                    <div className="w-8 h-8 rounded-full">
                                      <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                                    </div>
                                  </div>
                                </td>
                                <td className={`font-medium ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                                  {msg.senderId?.fullName || 'Deleted User'}
                                </td>
                                <td className="max-w-md">
                                  <div className="flex flex-col gap-1">
                                    {msg.text && (
                                      <div className="text-sm">{msg.text}</div>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                      {msg.image && (
                                        <span className="badge badge-primary badge-sm gap-1">
                                          <Camera className="w-3 h-3" />
                                          Image
                                        </span>
                                      )}
                                      {msg.attachments?.length > 0 && (
                                        <span className="badge badge-secondary badge-sm gap-1">
                                          <FileText className="w-3 h-3" />
                                          {msg.attachments.length} File{msg.attachments.length > 1 ? 's' : ''}
                                        </span>
                                      )}
                                      {msg.audio && (
                                        <span className="badge badge-accent badge-sm">Voice Message</span>
                                      )}
                                    </div>
                                    {!msg.text && !msg.image && !msg.attachments?.length && !msg.audio && (
                                      <span className="text-xs text-base-content/40 italic">[No content]</span>
                                    )}
                                  </div>
                                </td>
                                <td className="text-xs text-base-content/70">
                                  <div className="font-medium">{new Date(msg.createdAt).toLocaleDateString()}</div>
                                  <div className="text-base-content/50">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td>
                                  <div className="flex gap-1">
                                    {msg.text && (
                                      <button
                                        className="btn btn-xs btn-ghost tooltip"
                                        data-tip="Edit"
                                        onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-xs btn-error btn-ghost tooltip"
                                      data-tip="Delete"
                                      onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Mobile Card View - Keep original */}
                    <div className="md:hidden flex-1 overflow-y-auto max-h-[70vh]">
                      <div className="bg-base-200/30 min-h-full p-3 space-y-3 pb-32">
                        {threadMessages.length === 0 ? (
                          <div className="text-center py-12 text-base-content/60">
                            <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No messages found</p>
                          </div>
                        ) : (

                          <>
                            {/* Select All Bar */}
                            <div className="flex items-center justify-between bg-base-100 rounded-lg p-2 shadow-sm sticky top-0 z-10">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs"
                                  checked={allSelected}
                                  onChange={(e) => e.target.checked ? selectAllMessages() : deselectAllMessages()}
                                />
                                <span className="text-xs font-medium">
                                  {allSelected ? 'Deselect All' : 'Select All'}
                                </span>
                              </label>
                              {selectedMessages.length > 0 && (
                                <div className="badge badge-primary badge-sm">{selectedMessages.length}</div>
                              )}
                            </div>

                            {/* Messages */}
                            {threadMessages.map((msg, idx) => {
                              const prevMsg = idx > 0 ? threadMessages[idx - 1] : null;
                              const isSameSender = prevMsg?.senderId?._id === msg.senderId?._id;
                              const timeDiff = prevMsg ? new Date(msg.createdAt) - new Date(prevMsg.createdAt) : 0;
                              const showAvatar = !isSameSender || timeDiff > 300000;

                              return (
                                <div key={msg._id} className="flex items-start gap-2">
                                  {/* Checkbox */}
                                  <label className="mt-1">
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-xs"
                                      checked={selectedMessages.includes(msg._id)}
                                      onChange={() => toggleMessageSelection(msg._id)}
                                    />
                                  </label>

                                  {/* Avatar */}
                                  <div className="flex-shrink-0">
                                    {showAvatar ? (
                                      <div className="avatar">
                                        <div className="w-8 h-8 rounded-full">
                                          <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8"></div>
                                    )}
                                  </div>

                                  {/* Message Content */}
                                  <div className="flex-1 min-w-0">
                                    {showAvatar && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-semibold ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                                          {msg.senderId?.fullName || 'Deleted User'}
                                        </span>
                                        <span className="text-xs text-base-content/50">
                                          {new Date(msg.createdAt).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    )}

                                    <div className={`bg-base-100 rounded-lg p-2 shadow-sm ${selectedMessages.includes(msg._id) ? 'ring-2 ring-primary' : ''}`}>
                                      {msg.text && (
                                        <div className="text-sm mb-1 whitespace-pre-wrap break-words">{msg.text}</div>
                                      )}

                                      {(msg.image || msg.attachments?.length > 0 || msg.audio) && (
                                        <div className="flex flex-wrap gap-1 mb-1">
                                          {msg.image && (
                                            <div className="badge badge-primary badge-xs gap-1">
                                              <Camera className="w-2 h-2" />
                                              Image
                                            </div>
                                          )}
                                          {msg.attachments?.length > 0 && (
                                            <div className="badge badge-secondary badge-xs gap-1">
                                              <FileText className="w-2 h-2" />
                                              {msg.attachments.length}
                                            </div>
                                          )}
                                          {msg.audio && (
                                            <div className="badge badge-accent badge-xs">Voice</div>
                                          )}
                                        </div>
                                      )}

                                      {!msg.text && !msg.image && !msg.attachments?.length && !msg.audio && (
                                        <span className="text-xs text-base-content/40 italic">[No content]</span>
                                      )}

                                      {/* Actions */}
                                      <div className="flex gap-1 mt-2">
                                        {msg.text && (
                                          <button
                                            className="btn btn-xs btn-ghost"
                                            onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                        )}
                                        <button
                                          className="btn btn-xs btn-error btn-ghost"
                                          onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-base-content/60">
                    <div className="text-center">
                      <MessageSquare className="w-20 h-20 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">Select a conversation</p>
                      <p className="text-sm">Choose a conversation from the list to view messages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Groups View - sub-tabs like Messages
function GroupsView({ groups, setEditModal, setDeleteModal, groupsSubTab, setGroupsSubTab, groupConversations, selectedGroup, groupThreadMessages, onSelectGroupConversation, q, setQ, setPage, convPage, setConvPage, convPerPage, setConvPerPage, loading, groupThreadQ, setGroupThreadQ }) {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle individual message selection
  const toggleMessageSelection = (msgId) => {
    setSelectedMessages(prev =>
      prev.includes(msgId)
        ? prev.filter(id => id !== msgId)
        : [...prev, msgId]
    );
  };

  // Select all messages
  const selectAllMessages = () => {
    if (groupThreadMessages.length > 0) {
      setSelectedMessages(groupThreadMessages.map(m => m._id));
    }
  };

  // Deselect all messages
  const deselectAllMessages = () => {
    setSelectedMessages([]);
  };

  // Bulk delete selected messages
  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''}? This action cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedMessages.map(id => axiosInstance.delete(`/api/admin/messages/${id}`))
      );
      toast.success(`Successfully deleted ${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''}`);
      setSelectedMessages([]);
      // Reload the group conversation
      if (selectedGroup) {
        onSelectGroupConversation(selectedGroup);
      }
      window.location.reload();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some messages');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear selection when switching tabs or groups
  useEffect(() => {
    setSelectedMessages([]);
  }, [groupsSubTab, selectedGroup]);

  const allSelected = groupThreadMessages.length > 0 && selectedMessages.length === groupThreadMessages.length;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Groups Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage groups and group conversations</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Groups</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{groups.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Conversations</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{groupConversations.length}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedMessages.length > 0 && (
                  <>
                    <div className="badge badge-primary gap-2">
                      <span className="text-xs">{selectedMessages.length} selected</span>
                    </div>
                    <button
                      className="btn btn-sm btn-error gap-2"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span className="text-xs">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">Delete Selected</span>
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-sm btn-ghost gap-2"
                      onClick={deselectAllMessages}
                    >
                      <X className="w-4 h-4" />
                      <span className="text-xs">Clear</span>
                    </button>
                  </>
                )}
                {groupsSubTab === 'all' && (
                  <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('groups.csv', groups, [
                    { label: 'Name', value: r => r.name },
                    { label: 'Admin', value: r => r.admin?.fullName || '' },
                    { label: 'Members', value: r => (r.members?.length || 0) },
                    { label: 'Created', value: r => new Date(r.createdAt).toISOString() }
                  ])}>
                    <span className="text-xs md:text-sm">Export CSV</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-base-300">
            <div className="tabs tabs-boxed">
              <button
                className={`tab tab-sm md:tab-md ${groupsSubTab === 'all' ? 'tab-active' : ''}`}
                onClick={() => setGroupsSubTab('all')}
              >
                <span className="text-xs md:text-sm">All Groups</span>
              </button>
              <button
                className={`tab tab-sm md:tab-md ${groupsSubTab === 'conversations' ? 'tab-active' : ''}`}
                onClick={() => setGroupsSubTab('conversations')}
              >
                <span className="text-xs md:text-sm">Conversations</span>
              </button>
            </div>

            {groupsSubTab === 'all' && (
              <div className="form-control">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                  <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    className="input input-sm input-bordered pl-9 pr-4 w-full"
                    placeholder="Search groups..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {groupsSubTab === 'all' ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-2 md:p-4">
            {loading && (
              <div className="text-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
                <div className="text-base font-medium mt-4">Loading groups...</div>
              </div>
            )}

            {!loading && (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="table table-zebra w-full text-sm">
                    <thead>
                      <tr>
                        <th className="w-20">Avatar</th>
                        <th>Group Name</th>
                        <th>Admin</th>
                        <th>Members</th>
                        <th>Created</th>
                        <th className="w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group._id} className="hover">
                          <td>
                            <Avatar
                              src={group.groupPic}
                              name={group.name}
                              alt={group.name}
                              size="w-10 h-10"
                            />
                          </td>
                          <td>
                            <div className="font-medium">{group.name}</div>
                            {group.description && (
                              <div className="text-xs text-base-content/60 truncate max-w-xs">{group.description}</div>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-6 h-6 rounded-full">
                                  <img src={group.admin?.profilePic || '/avatar.png'} alt="" />
                                </div>
                              </div>
                              <span className="font-medium">{group.admin?.fullName || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="badge badge-neutral badge-sm">
                              {group.members?.length || 0} members
                            </div>
                          </td>
                          <td className="text-xs text-base-content/70">
                            <div>{new Date(group.createdAt).toLocaleDateString()}</div>
                            <div>{new Date(group.createdAt).toLocaleTimeString()}</div>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                className="btn btn-xs btn-warning"
                                onClick={() => setEditModal({
                                  type: 'change-admin',
                                  id: group._id,
                                  data: {
                                    name: group.name,
                                    currentAdmin: group.admin,
                                    members: group.members
                                  }
                                })}
                                title="Change Admin"
                              >
                                <Crown className="w-3 h-3" />
                              </button>
                              <button
                                className="btn btn-xs btn-ghost"
                                onClick={() => setEditModal({
                                  type: 'groups',
                                  id: group._id,
                                  data: { name: group.name, description: group.description || '' }
                                })}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                className="btn btn-xs btn-error btn-outline"
                                onClick={() => setDeleteModal({ type: 'groups', id: group._id, name: group.name })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-2">
                  {groups.map((group) => (
                    <div key={group._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar
                            src={group.groupPic}
                            name={group.name}
                            alt={group.name}
                            size="w-8 h-8"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{group.name}</div>
                            {group.description && (
                              <div className="text-xs text-base-content/60 truncate">{group.description}</div>
                            )}
                          </div>
                          <div className="badge badge-neutral badge-sm">
                            {group.members?.length || 0}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="avatar">
                            <div className="w-5 h-5 rounded-full">
                              <img src={group.admin?.profilePic || '/avatar.png'} alt="" />
                            </div>
                          </div>
                          <span className="text-xs text-base-content/60">Admin: {group.admin?.fullName || 'Unknown'}</span>
                          <span className="text-xs text-base-content/60">• {new Date(group.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-1 justify-end">
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => setEditModal({
                              type: 'groups',
                              id: group._id,
                              data: { name: group.name, description: group.description || '' }
                            })}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="text-xs">Edit</span>
                          </button>
                          <button
                            className="btn btn-xs btn-error btn-outline"
                            onClick={() => setDeleteModal({ type: 'groups', id: group._id, name: group.name })}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="text-xs">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-2 md:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[70vh]">
              {/* Group Conversations list */}
              <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-base-300 pr-0 lg:pr-4 pb-4 lg:pb-0 flex flex-col max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 mb-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs">Per page</span>
                    </label>
                    <select className="select select-sm select-bordered" value={convPerPage} onChange={(e) => { setConvPage(1); setConvPerPage(Number(e.target.value)); }}>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="join">
                    <button className="join-item btn btn-sm" disabled={convPage <= 1} onClick={() => setConvPage(p => Math.max(1, p - 1))}>Prev</button>
                    <button className="join-item btn btn-sm" onClick={() => setConvPage(p => p + 1)} disabled={groupConversations.length < convPerPage}>Next</button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : groupConversations.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No group conversations found</p>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {groupConversations.map((conv) => {
                      const isActive = selectedGroup === conv.group._id;

                      return (
                        <button
                          key={conv.group._id}
                          className={`w-full p-3 rounded-lg transition-all hover:bg-base-200 text-left ${isActive ? 'bg-primary/10 border-2 border-primary' : 'bg-base-100 border-2 border-transparent'
                            }`}
                          onClick={() => onSelectGroupConversation(conv.group._id)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar
                              src={conv.group.groupPic}
                              name={conv.group.name}
                              alt={conv.group.name}
                              size="w-10 h-10"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="text-sm font-semibold truncate">{conv.group.name}</div>
                                <span className="badge badge-primary badge-sm flex-shrink-0">{conv.count || 0}</span>
                              </div>

                              {conv.lastMessage && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="text-xs text-base-content/70 truncate flex-1">
                                    <span className="font-medium">{conv.sender?.fullName || 'User'}:</span>{' '}
                                    {conv.lastMessage.text || '[media]'}
                                  </div>
                                  <div className="text-xs text-base-content/50 flex-shrink-0">
                                    {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group thread messages */}
              <div className="lg:col-span-2 flex flex-col">
                {selectedGroup ? (
                  <>
                    {/* Search bar */}
                    <div className="mb-4">
                      <div className="form-control">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                          <input
                            value={groupThreadQ}
                            onChange={(e) => {
                              setGroupThreadQ(e.target.value);
                              if (selectedGroup) onSelectGroupConversation(selectedGroup);
                            }}
                            className="input input-sm input-bordered pl-9 pr-4 w-full"
                            placeholder="Search in group..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Messages count */}
                    {groupThreadMessages.length > 0 && (
                      <div className="mb-3 text-xs text-base-content/60 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{groupThreadMessages.length} message{groupThreadMessages.length !== 1 ? 's' : ''} in this group</span>
                      </div>
                    )}

                    {/* Desktop Table View */}
                    <div className="hidden md:block flex-1 overflow-y-auto max-h-[70vh]">
                      {groupThreadMessages.length === 0 ? (
                        <div className="text-center py-12 text-base-content/60">
                          <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No messages found</p>
                        </div>
                      ) : (
                        <table className="table table-zebra w-full text-sm">
                          <thead className="sticky top-0 bg-base-100 z-10">
                            <tr>
                              <th className="w-12">
                                <label>
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={allSelected}
                                    onChange={(e) => e.target.checked ? selectAllMessages() : deselectAllMessages()}
                                  />
                                </label>
                              </th>
                              <th className="w-16">Avatar</th>
                              <th className="w-32">Member</th>
                              <th>Message</th>
                              <th className="w-40">Time</th>
                              <th className="w-24">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupThreadMessages.map((msg) => (
                              <tr key={msg._id} className="hover">
                                <td>
                                  <label>
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-sm"
                                      checked={selectedMessages.includes(msg._id)}
                                      onChange={() => toggleMessageSelection(msg._id)}
                                    />
                                  </label>
                                </td>
                                <td>
                                  <div className="avatar">
                                    <div className="w-8 h-8 rounded-full">
                                      <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                                    </div>
                                  </div>
                                </td>
                                <td className={`font-medium ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                                  {msg.senderId?.fullName || 'Deleted User'}
                                </td>
                                <td className="max-w-md">
                                  <div className="flex flex-col gap-1">
                                    {msg.text && (
                                      <div className="text-sm">{msg.text}</div>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                      {msg.image && (
                                        <span className="badge badge-primary badge-sm gap-1">
                                          <Camera className="w-3 h-3" />
                                          Image
                                        </span>
                                      )}
                                      {msg.attachments?.length > 0 && (
                                        <span className="badge badge-secondary badge-sm gap-1">
                                          <FileText className="w-3 h-3" />
                                          {msg.attachments.length} File{msg.attachments.length > 1 ? 's' : ''}
                                        </span>
                                      )}
                                      {msg.audio && (
                                        <span className="badge badge-accent badge-sm">Voice Message</span>
                                      )}
                                    </div>
                                    {!msg.text && !msg.image && !msg.attachments?.length && !msg.audio && (
                                      <span className="text-xs text-base-content/40 italic">[No content]</span>
                                    )}
                                  </div>
                                </td>
                                <td className="text-xs text-base-content/70">
                                  <div className="font-medium">{new Date(msg.createdAt).toLocaleDateString()}</div>
                                  <div className="text-base-content/50">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td>
                                  <div className="flex gap-1">
                                    {msg.text && (
                                      <button
                                        className="btn btn-xs btn-ghost tooltip"
                                        data-tip="Edit"
                                        onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-xs btn-error btn-ghost tooltip"
                                      data-tip="Delete"
                                      onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex-1 overflow-y-auto max-h-[70vh] space-y-2">
                      {groupThreadMessages.length === 0 ? (
                        <div className="text-center py-12 text-base-content/60">
                          <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No messages found</p>
                        </div>
                      ) : (
                        groupThreadMessages.map((msg) => (
                          <div key={msg._id} className={`card shadow-sm ${selectedMessages.includes(msg._id) ? 'bg-primary/10 border-2 border-primary' : 'bg-base-200'}`}>
                            <div className="card-body p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <label>
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={selectedMessages.includes(msg._id)}
                                    onChange={() => toggleMessageSelection(msg._id)}
                                  />
                                </label>
                                <div className="avatar">
                                  <div className="w-8 h-8 rounded-full">
                                    <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                                    {msg.senderId?.fullName || 'Deleted User'}
                                  </div>
                                  <div className="text-xs text-base-content/60">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {msg.text && (
                                <div className="text-sm mb-2">{msg.text}</div>
                              )}

                              <div className="flex flex-wrap gap-1 mb-2">
                                {msg.image && (
                                  <span className="badge badge-primary badge-sm gap-1">
                                    <Camera className="w-3 h-3" />
                                    Image
                                  </span>
                                )}
                                {msg.attachments?.length > 0 && (
                                  <span className="badge badge-secondary badge-sm gap-1">
                                    <FileText className="w-3 h-3" />
                                    {msg.attachments.length} File{msg.attachments.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {msg.audio && (
                                  <span className="badge badge-accent badge-sm">Voice</span>
                                )}
                              </div>

                              <div className="flex gap-1 justify-end">
                                {msg.text && (
                                  <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span className="text-xs">Edit</span>
                                  </button>
                                )}
                                <button
                                  className="btn btn-xs btn-error btn-outline"
                                  onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="text-xs">Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-base-content/60">
                    <div className="text-center">
                      <Layers className="w-20 h-20 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">Select a group</p>
                      <p className="text-sm">Choose a group from the list to view messages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Feature Requests View for Admin
import FeatureRequestModal from "../components/admin/FeatureRequestModal";
import DeclineConfirmationModal from "../components/admin/DeclineConfirmationModal";

// Feature Requests View for Admin
function FeatureRequestsView({ requests, loading, onRefresh, setDeleteModal }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [declineModalRequest, setDeclineModalRequest] = useState(null);

  // Filter and sort requests
  const filteredRequests = requests
    .filter(request => {
      const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || request.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'mostVotes':
          return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
        case 'leastVotes':
          return (a.upvotes - a.downvotes) - (b.upvotes - b.downvotes);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Status badge styling
  const getStatusBadge = (status) => {
    const badges = {
      'pending': 'badge-neutral',
      'reviewing': 'badge-warning',
      'approved': 'badge-success',
      'rejected': 'badge-error',
      'implemented': 'badge-info'
    };

    return badges[status] || 'badge-neutral';
  };

  // Category badge styling
  const getCategoryBadge = (category) => {
    const badges = {
      'bug': 'badge-error',
      'feature': 'badge-primary',
      'improvement': 'badge-secondary',
      'ui': 'badge-accent'
    };

    return badges[category] || 'badge-neutral';
  };

  const updateRequest = async (requestId, action, reason = null) => {
    try {
      let response;
      if (action === 'approve') {
        response = await axiosInstance.patch(`/api/feature-requests/admin/feature-requests/${requestId}/approve`);
      } else if (action === 'decline') {
        response = await axiosInstance.patch(`/api/feature-requests/admin/feature-requests/${requestId}/decline`, { reason });
      } else {
        // Legacy status update
        response = await axiosInstance.patch(`/api/feature-requests/admin/feature-requests/${requestId}/status`, { status: action.status, category: action.category });
      }

      if (response.data.success) {
        toast.success(`Request ${action === 'approve' ? 'approved' : action === 'decline' ? 'declined' : 'updated'} successfully!`);
        onRefresh();
      } else {
        toast.error('Failed to update request.');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error(error.response?.data?.message || 'Failed to update request.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Feature Request Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage and moderate community feature requests</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Requests</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{requests.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Pending Review</div>
                  <div className="stat-value text-sm md:text-lg text-warning">{requests.filter(r => r.status === 'pending').length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Approved</div>
                  <div className="stat-value text-sm md:text-lg text-success">{requests.filter(r => r.status === 'approved').length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="form-control flex-1">
              <div className="join">
                <input
                  type="text"
                  placeholder="Search requests..."
                  className="input input-bordered join-item flex-1"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-primary join-item" onClick={onRefresh} title="Refresh">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="btn btn-primary join-item">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <select
                className="select select-bordered select-sm min-w-32"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="approved">Approved</option>
                <option value="implemented">Implemented</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                className="select select-bordered select-sm min-w-32"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="bug">Bug Fix</option>
                <option value="feature">New Feature</option>
                <option value="improvement">Improvement</option>
                <option value="ui">UI/UX</option>
              </select>

              <select
                className="select select-bordered select-sm min-w-32"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="mostVotes">Most Votes</option>
                <option value="leastVotes">Least Votes</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="text-center py-12 col-span-3">
            <span className="loading loading-spinner loading-lg"></span>
            <div className="text-base font-medium mt-4">Loading feature requests...</div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="card bg-base-200 col-span-3">
            <div className="card-body text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-base-content/70">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'No feature requests have been submitted yet.'}
              </p>
            </div>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div key={request._id} className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`badge badge-sm ${getCategoryBadge(request.category)}`}>
                        {request.category}
                      </span>
                      <span className={`badge badge-sm ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                      <span className="badge badge-ghost badge-sm">
                        Score: {request.upvotes - request.downvotes}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">{request.title}</h3>
                    <p className="text-sm text-base-content/70 mb-3 line-clamp-3">{request.description}</p>

                    <div className="flex items-center gap-4 text-xs text-base-content/60">
                      <span>By: {request.submittedBy?.fullName || 'Anonymous'}</span>
                      <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-end">
                  <button className="btn btn-sm btn-ghost" onClick={() => setSelectedRequest(request)}>See More</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRequest && (
        <FeatureRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={updateRequest}
          onDelete={setDeleteModal}
          onDeclineRequest={setDeclineModalRequest}
        />
      )}

      {declineModalRequest && (
        <DeclineConfirmationModal
          request={declineModalRequest}
          onClose={() => setDeclineModalRequest(null)}
          onConfirm={async (requestId, reason) => {
            await updateRequest(requestId, 'decline', reason);
          }}
        />
      )}
    </div>
  );
}

// Community Groups View
function CommunityGroupsView({ communityGroups, loading, onRefresh }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', groupPic: null });
  const [groupPicPreview, setGroupPicPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsCreating(true);
    try {
      await axiosInstance.post('/api/admin/community-groups', newGroup);
      toast.success('Community group created!');
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', groupPic: null });
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup({
      id: group._id,
      name: group.name,
      description: group.description || '',
      groupPic: group.groupPic
    });
    setGroupPicPreview(group.groupPic);
    setShowEditModal(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsUpdating(true);
    try {
      await axiosInstance.patch(`/api/admin/community-groups/${editingGroup.id}`, {
        name: editingGroup.name,
        description: editingGroup.description,
        groupPic: editingGroup.groupPic
      });
      toast.success('Community group updated!');
      setShowEditModal(false);
      setEditingGroup(null);
      setGroupPicPreview(null);
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Delete this community group? All members will be removed.')) return;

    try {
      await axiosInstance.delete(`/api/admin/community-groups/${groupId}`);
      toast.success('Group deleted');
      onRefresh();
    } catch (err) {
      console.error('Failed to delete group:', err);
      toast.error('Failed to delete group');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Community Groups</h2>
          <p className="text-sm text-base-content/60">Public groups that all users can discover and join</p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => setShowCreateModal(true)}
        >
          <Users className="w-4 h-4" />
          Create Community Group
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : communityGroups.length === 0 ? (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <Users className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
          <p className="text-base-content/60">No community groups yet</p>
          <button
            className="btn btn-primary btn-sm mt-4"
            onClick={() => setShowCreateModal(true)}
          >
            Create First Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communityGroups.map((group) => (
            <div key={group._id} className="card bg-base-200 shadow-lg">
              <div className="card-body">
                <div className="flex items-start gap-3">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full">
                      <img src={group.groupPic || '/avatar.png'} alt={group.name} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{group.name}</h3>
                    <p className="text-sm text-base-content/60 line-clamp-2">{group.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-base-content/60 mt-2">
                  <span>{group.members?.length || 0} members</span>
                  <span className="badge badge-success badge-sm">Public</span>
                </div>

                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-sm btn-ghost gap-1"
                    onClick={() => handleEditGroup(group)}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-error btn-outline gap-1"
                    onClick={() => handleDeleteGroup(group._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create Community Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              {/* Group Picture Upload */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative group">
                  <div className="avatar">
                    <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      {groupPicPreview ? (
                        <img src={groupPicPreview} alt="Group preview" />
                      ) : (
                        <div className="bg-primary/20 w-full h-full flex items-center justify-center">
                          <Users className="w-10 h-10 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                    <div className="text-center">
                      <Camera className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs">Upload</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be less than 5MB');
                          return;
                        }

                        // Silently compress in background
                        (async () => {
                          const { compressImageToBase64 } = await import('../utils/imageCompression');
                          const base64 = await compressImageToBase64(file);
                          setGroupPicPreview(base64);
                          setNewGroup({ ...newGroup, groupPic: base64 });
                        })();
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-base-content/60 mt-2">Click to upload group picture</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Group Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g., General Discussion"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="What is this group about?"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroup({ name: '', description: '', groupPic: null });
                    setGroupPicPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Edit Community Group</h3>
            <form onSubmit={handleUpdateGroup} className="space-y-4">
              {/* Group Picture Upload */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative group">
                  <div className="avatar">
                    <div className="w-24 h-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      {groupPicPreview ? (
                        <img src={groupPicPreview} alt="Group preview" />
                      ) : (
                        <div className="bg-primary/20 w-full h-full flex items-center justify-center">
                          <Users className="w-10 h-10 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                    <div className="text-center">
                      <Camera className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs">Upload</div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image must be less than 5MB');
                          return;
                        }

                        // Silently compress in background
                        (async () => {
                          const { compressImageToBase64 } = await import('../utils/imageCompression');
                          const base64 = await compressImageToBase64(file);
                          setGroupPicPreview(base64);
                          setEditingGroup({ ...editingGroup, groupPic: base64 });
                        })();
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-base-content/60 mt-2">Click to upload group picture</p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Group Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  placeholder="e.g., General Discussion"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="3"
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  placeholder="What is this group about?"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGroup(null);
                    setGroupPicPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Updating...
                    </>
                  ) : (
                    'Update Group'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Uploads View
function UploadsView({ uploads, q, setQ, page, setPage, perPage, setPerPage, total, onRefresh, loading }) {
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (id) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Top Row - Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="form-control flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 md:w-5 md:h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                  <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    className="input input-sm md:input-md input-bordered pl-9 md:pl-10 pr-4 w-full"
                    placeholder="Search filename, type, or URL"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-outline flex-1 sm:flex-none" onClick={() => exportCSV('uploads.csv', uploads, [
                  { label: 'Kind', value: r => r.kind },
                  { label: 'Filename', value: r => r.filename || '' },
                  { label: 'ContentType', value: r => r.contentType || '' },
                  { label: 'URL', value: r => r.url },
                  { label: 'User', value: r => r.user?.fullName || '' },
                  { label: 'Email', value: r => r.user?.email || '' },
                  { label: 'Where', value: r => r.where?.type + ':' + (r.where?.id || '') },
                  { label: 'CreatedAt', value: r => new Date(r.createdAt).toISOString() }
                ])}>
                  <span className="text-xs md:text-sm">Export CSV</span>
                </button>
                <button className="btn btn-sm btn-primary flex-1 sm:flex-none" onClick={onRefresh}>
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Refresh</span>
                </button>
              </div>
            </div>

            {/* Bottom Row - Stats and Controls */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Files</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{total}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Current Page</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{page}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">File Types</div>
                  <div className="stat-value text-sm md:text-lg text-accent">{new Set(uploads.map(u => u.kind)).size}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Items per page</span>
                  </label>
                  <select
                    className="select select-sm select-bordered"
                    value={perPage}
                    onChange={(e) => { setPage(1); setPerPage(Number(e.target.value)); }}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={75}>75</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  <button className="join-item btn btn-sm btn-disabled">
                    <span className="text-xs">Page {page}</span>
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    onClick={() => setPage(p => p + 1)}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <div className="text-base font-medium mt-4">Loading uploads...</div>
            <div className="text-base-content/60">Please wait while we fetch the data</div>
          </div>
        </div>
      )}

      {/* Uploads List */}
      {!loading && (
        <div className="space-y-3">
          {uploads.filter(u => u && u._id).map(u => {
            const isExpanded = expandedItems.has(u._id);
            return (
              <div key={u._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
                <div className="card-body p-4 md:p-6">
                  {/* Main Upload Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                      {/* File Preview */}
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-base-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {u.contentType?.startsWith('image/') || u.kind.includes('picture') ? (
                          u.url && (
                            <img
                              src={u.url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )
                        ) : u.contentType?.startsWith('video/') ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <FileText className="w-6 h-6 text-primary mx-auto" />
                              <div className="text-xs text-primary">VIDEO</div>
                            </div>
                          </div>
                        ) : u.contentType?.startsWith('audio/') || u.kind === 'status-audio' || u.url?.includes('/audio/') || u.filename?.includes('voice') ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-6 h-6 mx-auto mb-1 bg-accent rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </div>
                              <div className="text-xs text-accent">AUDIO</div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <Download className="w-6 h-6 text-base-content/40 mx-auto" />
                              <div className="text-xs text-base-content/40">FILE</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                          <div className={`badge badge-sm md:badge-lg ${u.kind === 'message-attachment' ? 'badge-primary' :
                            u.kind === 'message-image' ? 'badge-secondary' :
                              u.kind === 'status-media' ? 'badge-accent' :
                                u.kind === 'status-audio' || u.url?.includes('/audio/') || u.contentType?.startsWith('audio/') ? 'badge-info' :
                                  u.kind === 'profile-picture' ? 'badge-success' :
                                    u.kind === 'group-picture' ? 'badge-warning' : 'badge-ghost'
                            }`}>
                            <span className="text-xs md:text-sm">
                              {(u.url?.includes('/audio/') || u.contentType?.startsWith('audio/')) && u.kind !== 'status-audio'
                                ? 'VOICE MESSAGE'
                                : u.kind.replace('-', ' ').toUpperCase()
                              }
                            </span>
                          </div>
                          <div className={`badge badge-sm badge-outline ${u.where?.type === 'group' ? 'badge-warning' :
                            u.where?.type === 'dm' ? 'badge-info' :
                              u.where?.type === 'status' ? 'badge-accent' :
                                u.where?.type === 'user-profile' ? 'badge-success' : ''
                            }`}>
                            <span className="text-xs">{u.where?.type}: {String(u.where?.id).slice(-6)}</span>
                          </div>
                        </div>

                        <h3 className="font-medium text-sm md:text-base truncate">
                          <a
                            href={u.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="link link-primary"
                          >
                            {u.filename || (u.url ? u.url.split('/').pop() : null) || 'Unnamed File'}
                          </a>
                        </h3>

                        <div className="text-xs md:text-sm text-base-content/70 mt-1">
                          <div>{u.contentType || 'Unknown type'}</div>
                          <div>
                            {u.size && `${formatFileSize(u.size)} • `}
                            Uploaded {new Date(u.createdAt).toLocaleDateString()}
                            <span className="hidden sm:inline"> at {new Date(u.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        className="btn btn-xs md:btn-sm btn-ghost"
                        onClick={() => toggleExpanded(u._id)}
                      >
                        <span className="text-xs md:text-sm">{isExpanded ? 'Show Less' : 'Show More'}</span>
                      </button>
                      <button
                        className="btn btn-xs md:btn-sm btn-error btn-outline"
                        onClick={() => window.dispatchEvent(new CustomEvent('admin:deleteUpload', { detail: u }))}
                        title={`Delete ${u.kind}`}
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-sm">Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-4 border-t border-base-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* User Information */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base-content/80">User Information</h4>
                          {u.user ? (
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img
                                    src={u.user.profilePic || '/avatar.png'}
                                    alt=""
                                    onError={(e) => { e.target.src = '/avatar.png'; }}
                                  />
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">{u.user.fullName}</div>
                                <div className="text-sm text-base-content/60">{u.user.email}</div>
                                <div className="text-xs text-base-content/50">
                                  Role: {u.user.role || 'user'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-base-content/60">No user information available</div>
                          )}
                        </div>

                        {/* File Details */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base-content/80">File Details</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Content Type:</span> {u.contentType || 'Unknown'}</div>
                            <div><span className="font-medium">File Size:</span> {u.size ? formatFileSize(u.size) : 'Unknown'}</div>
                            <div><span className="font-medium">Storage Key:</span> {u.storageKey || 'N/A'}</div>
                            <div><span className="font-medium">Upload ID:</span> {u._id}</div>
                          </div>
                        </div>

                        {/* Context Information */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-base-content/80">Context</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">Upload Type:</span> {u.kind}</div>
                            <div><span className="font-medium">Location:</span> {u.where?.type || 'Unknown'}</div>
                            <div><span className="font-medium">Reference ID:</span> {u.where?.id || 'N/A'}</div>
                            <div><span className="font-medium">Created:</span> {new Date(u.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* Media Preview */}
                      {u.url && (
                        <div className="mt-4 pt-4 border-t border-base-300">
                          <h4 className="font-semibold text-base-content/80 mb-2">Media Preview</h4>
                          <div className="bg-base-200 p-3 rounded-lg">
                            {u.contentType?.startsWith('image/') || u.kind.includes('picture') ? (
                              <img src={u.url} alt="Preview" className="max-w-full h-auto rounded" />
                            ) : u.contentType?.startsWith('video/') ? (
                              <video src={u.url} className="max-w-full h-auto rounded" controls />
                            ) : u.contentType?.startsWith('audio/') || u.kind === 'status-audio' || u.url?.includes('/audio/') || u.filename?.includes('voice') ? (
                              <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-base-100 rounded">
                                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white rounded-full"></div>
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {u.url?.includes('/audio/') || u.filename?.includes('voice') ? 'Voice Message' : 'Audio File'}
                                    </div>
                                    <div className="text-sm text-base-content/60">
                                      {u.contentType || 'Audio file'}
                                      {u.size && ` • ${formatFileSize(u.size)}`}
                                    </div>
                                  </div>
                                </div>
                                <audio src={u.url} className="w-full" controls />
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <Download className="w-12 h-12 text-base-content/40 mx-auto mb-2" />
                                <div className="font-medium">File Download</div>
                                <div className="text-sm text-base-content/60 mb-3">
                                  {u.contentType || 'Unknown file type'}
                                  {u.size && ` • ${formatFileSize(u.size)}`}
                                </div>
                                <a
                                  href={u.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-sm btn-primary"
                                >
                                  Download File
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Full URL */}
                      {u.url && (
                        <div className="mt-4 pt-4 border-t border-base-300">
                          <h4 className="font-semibold text-base-content/80 mb-2">File URL</h4>
                          <div className="bg-base-200 p-3 rounded-lg">
                            <code className="text-sm break-all">{u.url}</code>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {uploads.length === 0 && (
            <div className="card bg-base-100 shadow">
              <div className="card-body text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                  <Download className="w-8 h-8 text-base-content/40" />
                </div>
                <div className="text-lg font-medium">No uploads found</div>
                <div className="text-base-content/60 mt-2">
                  {q ? `No uploads match your search for "${q}"` : 'There are no uploads to display'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Statuses View
// Utility: CSV export
function exportCSV(filename, rows, columns) {
  try {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const lines = rows.map(r => columns.map(c => {
      const val = typeof c.value === 'function' ? c.value(r) : (c.key ? r[c.key] : '');
      const s = (val ?? '').toString().replace(/"/g, '""');
      return `"${s}"`;
    }).join(',')).join('\n');
    const csv = header + '\n' + lines;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('CSV export failed', e);
  }
}

function StatusesView({ statuses, setDeleteModal }) {
  const [expandedStatuses, setExpandedStatuses] = useState(new Set());

  const toggleExpanded = (statusId) => {
    const newExpanded = new Set(expandedStatuses);
    if (newExpanded.has(statusId)) {
      newExpanded.delete(statusId);
    } else {
      newExpanded.add(statusId);
    }
    setExpandedStatuses(newExpanded);
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Status Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage user status posts and media</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Statuses</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{statuses.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Images</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{statuses.filter(s => s.mediaType === 'image').length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Videos</div>
                  <div className="stat-value text-sm md:text-lg text-accent">{statuses.filter(s => s.mediaType === 'video').length}</div>
                </div>
              </div>
              <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('statuses.csv', statuses, [
                { label: 'User', value: r => r.userId?.fullName || '' },
                { label: 'Type', value: r => r.mediaType },
                { label: 'Caption', value: r => r.caption || '' },
                { label: 'Created', value: r => new Date(r.createdAt).toISOString() }
              ])}>
                <span className="text-xs md:text-sm">Export CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statuses List */}
      <div className="space-y-3">
        {statuses.map((status) => {
          const isExpanded = expandedStatuses.has(status._id);
          return (
            <div key={status._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
              <div className="card-body p-4 md:p-6">
                {/* Basic Status Info */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    {/* Media Preview */}
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-base-300 flex-shrink-0">
                      {status.mediaType === 'image' ? (
                        <img src={status.mediaUrl} alt="" className="w-full h-full object-cover" />
                      ) : status.mediaType === 'video' ? (
                        <video src={status.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-base-content/40" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className={`font-semibold text-sm md:text-base truncate ${!status.userId?.fullName ? 'italic text-base-content/50' : ''}`}>
                          {status.userId?.fullName || 'Deleted User'}
                        </h3>
                        <div className={`badge badge-sm md:badge-lg ${status.mediaType === 'image' ? 'badge-secondary' :
                          status.mediaType === 'video' ? 'badge-accent' : 'badge-ghost'
                          }`}>
                          <span className="text-xs md:text-sm">{status.mediaType?.toUpperCase() || 'UNKNOWN'}</span>
                        </div>
                      </div>

                      {status.caption && (
                        <p className="text-xs md:text-sm text-base-content/80 line-clamp-2 mb-2">{status.caption}</p>
                      )}

                      <div className="text-xs md:text-sm text-base-content/60">
                        Posted {new Date(status.createdAt).toLocaleDateString()}
                        <span className="hidden sm:inline"> at {new Date(status.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      className="btn btn-xs md:btn-sm btn-ghost"
                      onClick={() => toggleExpanded(status._id)}
                    >
                      <span className="text-xs md:text-sm">{isExpanded ? 'Show Less' : 'Show More'}</span>
                    </button>
                    <button
                      className="btn btn-xs md:btn-sm btn-error btn-outline"
                      onClick={() => setDeleteModal({ type: 'statuses', id: status._id, name: 'this status' })}
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 md:mt-6 pt-4 border-t border-base-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {/* User Information */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content/80">User Information</h4>
                        {status.userId ? (
                          <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                            <div className="avatar">
                              <div className="w-12 h-12 rounded-full">
                                <img src={status.userId.profilePic || '/avatar.png'} alt="" />
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{status.userId.fullName}</div>
                              <div className="text-sm text-base-content/60">{status.userId.email}</div>
                              <div className="text-xs text-base-content/50">Role: {status.userId.role || 'user'}</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-base-content/60 p-3 bg-base-200 rounded-lg">No user information available</div>
                        )}
                      </div>

                      {/* Status Details */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-base-content/80">Status Details</h4>
                        <div className="space-y-2 text-sm p-3 bg-base-200 rounded-lg">
                          <div><span className="font-medium">Status ID:</span> {status._id}</div>
                          <div><span className="font-medium">Media Type:</span> {status.mediaType || 'Unknown'}</div>
                          <div><span className="font-medium">Created:</span> {new Date(status.createdAt).toLocaleString()}</div>
                          <div><span className="font-medium">Updated:</span> {new Date(status.updatedAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Full Caption */}
                    {status.caption && (
                      <div className="mt-4 pt-4 border-t border-base-300">
                        <h4 className="font-semibold text-base-content/80 mb-2">Full Caption</h4>
                        <div className="bg-base-200 p-3 rounded-lg">
                          <p className="text-base-content/80">{status.caption}</p>
                        </div>
                      </div>
                    )}

                    {/* Media URL */}
                    {status.mediaUrl && (
                      <div className="mt-4 pt-4 border-t border-base-300">
                        <h4 className="font-semibold text-base-content/80 mb-2">Media URL</h4>
                        <div className="bg-base-200 p-3 rounded-lg">
                          <code className="text-sm break-all">{status.mediaUrl}</code>
                        </div>
                      </div>
                    )}

                    {/* Full Media Preview */}
                    <div className="mt-4 pt-4 border-t border-base-300">
                      <h4 className="font-semibold text-base-content/80 mb-2">Full Media Preview</h4>
                      <div className="bg-base-200 p-3 rounded-lg">
                        {status.mediaType === 'image' ? (
                          <img src={status.mediaUrl} alt="" className="max-w-full h-auto rounded" />
                        ) : status.mediaType === 'video' ? (
                          <video src={status.mediaUrl} className="max-w-full h-auto rounded" controls />
                        ) : (
                          <div className="text-center py-8 text-base-content/60">Media preview not available</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {statuses.length === 0 && (
          <div className="card bg-base-100 shadow">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                <Image className="w-8 h-8 text-base-content/40" />
              </div>
              <div className="text-lg font-medium">No statuses found</div>
              <div className="text-base-content/60 mt-2">There are no status posts to display</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Posts View
function PostsView({ posts, q, setQ, page, setPage, perPage, setPerPage, total, visibility, setVisibility, onRefresh, loading, setDeleteModal }) {
  const [expandedPosts, setExpandedPosts] = useState(new Set());

  const toggleExpanded = (postId) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const deleteComment = async (postId, commentId) => {
    try {
      await axiosInstance.delete(`/api/admin/posts/${postId}/comments/${commentId}`);
      toast.success('Comment deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const deleteReply = async (postId, commentId, replyId) => {
    try {
      await axiosInstance.delete(`/api/admin/posts/${postId}/comments/${commentId}/replies/${replyId}`);
      toast.success('Reply deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  const renderReplies = (replies, postId, commentId, level = 1) => {
    if (!replies || replies.length === 0) return null;

    return (
      <div className={`ml-${Math.min(level * 4, 16)} mt-2 space-y-2`}>
        {replies.map(reply => (
          <div key={reply._id} className="bg-base-200 p-2 rounded text-xs">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{reply.user?.fullName}</span>
                <span className="text-base-content/60">{new Date(reply.createdAt).toLocaleString()}</span>
              </div>
              <button
                className="btn btn-xs btn-error btn-outline"
                onClick={() => deleteReply(postId, commentId, reply._id)}
              >
                <Trash2 className="w-2 h-2" />
              </button>
            </div>
            <p className="text-base-content/80">{reply.text}</p>
            {reply.likes?.length > 0 && (
              <div className="text-xs text-base-content/60 mt-1">Likes: {reply.likes.length}</div>
            )}
            {renderReplies(reply.replies, postId, commentId, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col gap-4">
            {/* Top Row - Title and Search */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base md:text-lg font-semibold">Posts Management</h2>
                <p className="text-sm text-base-content/60 hidden sm:block">Manage user posts and content</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="form-control flex-1 sm:flex-none">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                    <input
                      value={q}
                      onChange={(e) => { setQ(e.target.value); setPage(1); }}
                      className="input input-sm input-bordered pl-9 pr-4 w-full"
                      placeholder="Search posts..."
                    />
                  </div>
                </div>
                <select
                  className="select select-sm select-bordered"
                  value={visibility}
                  onChange={(e) => { setVisibility(e.target.value); setPage(1); }}
                >
                  <option value="">All Visibility</option>
                  <option value="public">Public</option>
                  <option value="members">Members Only</option>
                </select>
              </div>
            </div>

            {/* Bottom Row - Stats and Controls */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Posts</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{total}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Current Page</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{page}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Public Posts</div>
                  <div className="stat-value text-sm md:text-lg text-success">{posts.filter(p => p.visibility === 'public').length}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
                <button className="btn btn-sm btn-outline" onClick={() => exportCSV('posts.csv', posts, [
                  { label: 'Title', value: r => r.title },
                  { label: 'Caption', value: r => r.caption },
                  { label: 'Author', value: r => r.postedBy?.fullName || '' },
                  { label: 'Visibility', value: r => r.visibility },
                  { label: 'Likes', value: r => r.likes?.length || 0 },
                  { label: 'Comments', value: r => r.comments?.length || 0 },
                  { label: 'Created', value: r => new Date(r.createdAt).toISOString() }
                ])}>
                  <span className="text-xs md:text-sm">Export CSV</span>
                </button>
                <button className="btn btn-sm btn-primary" onClick={onRefresh}>
                  <Download className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">Refresh</span>
                </button>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Per page</span>
                  </label>
                  <select className="select select-sm select-bordered" value={perPage} onChange={(e) => { setPage(1); setPerPage(Number(e.target.value)); }}>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="join">
                  <button className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </button>
                  <button className="join-item btn btn-sm btn-disabled">
                    <span className="text-xs">Page {page}</span>
                  </button>
                  <button className="join-item btn btn-sm" onClick={() => setPage(p => p + 1)}>
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
            <div className="text-base font-medium mt-4">Loading posts...</div>
            <div className="text-base-content/60">Please wait while we fetch the data</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && posts.length === 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-base-content/40" />
            </div>
            <div className="text-lg font-medium">No posts found</div>
            <div className="text-base-content/60 mt-2">
              {q ? `No posts match your search for "${q}"` : 'There are no posts to display'}
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-3">

        {!loading && posts.map(post => {
          const isExpanded = expandedPosts.has(post._id);
          return (
            <div key={post._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
              <div className="card-body p-4 md:p-6">
                {/* Basic Post Information */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm md:text-base truncate">{post.postedBy?.fullName}</div>
                        <div className="text-xs md:text-sm text-base-content/60">
                          {new Date(post.createdAt).toLocaleDateString()}
                          <span className="hidden sm:inline"> at {new Date(post.createdAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`badge badge-sm md:badge-md ${post.visibility === 'public' ? 'badge-success' : 'badge-warning'}`}>
                          <span className="text-xs md:text-sm">{post.visibility}</span>
                        </div>
                      </div>
                    </div>

                    {/* Title and Subtitle (always visible) */}
                    <div className="mt-3">
                      {post.title && (
                        <h3 className="font-bold text-base md:text-xl mb-2 line-clamp-1">{post.title}</h3>
                      )}
                      {post.caption && (
                        <p className="text-xs md:text-sm text-base-content/80 line-clamp-2">{post.caption}</p>
                      )}
                    </div>

                    {/* Basic Stats (always visible) */}
                    <div className="flex flex-wrap items-center gap-3 md:gap-6 text-xs md:text-sm text-base-content/60 mt-3">
                      <span>Likes: {post.likes?.length || 0}</span>
                      <span>Comments: {post.comments?.length || 0}</span>
                      <span>Expires: {new Date(post.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0">
                    <button
                      className="btn btn-xs md:btn-sm btn-ghost"
                      onClick={() => toggleExpanded(post._id)}
                    >
                      <span className="text-xs md:text-sm">{isExpanded ? 'Show Less' : 'Show More'}</span>
                    </button>
                    <button
                      className="btn btn-xs md:btn-sm btn-error btn-outline"
                      onClick={() => setDeleteModal({ type: 'posts', id: post._id, name: post.title || 'this post' })}
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="text-xs md:text-sm">Delete</span>
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 md:mt-6 pt-4 border-t border-base-300 space-y-4">
                    {/* Author Details */}
                    <div className="flex items-center gap-3 p-3 bg-base-100 rounded-lg">
                      <img src={post.postedBy?.profilePic || '/avatar.png'} className="w-12 h-12 rounded-full" alt="" />
                      <div>
                        <div className="font-medium">{post.postedBy?.fullName}</div>
                        <div className="text-sm text-base-content/60">{post.postedBy?.email}</div>
                        <div className="text-xs text-base-content/50">Role: {post.postedBy?.role || 'user'}</div>
                      </div>
                    </div>

                    {/* Full Caption */}
                    {post.caption && (
                      <div className="p-3 bg-base-100 rounded-lg">
                        <h4 className="font-semibold mb-2">Full Caption</h4>
                        <p className="text-base-content/80">{post.caption}</p>
                      </div>
                    )}

                    {/* Post Media */}
                    {post.items && post.items.length > 0 && (
                      <div className="p-3 bg-base-100 rounded-lg">
                        <h4 className="font-semibold mb-3">Media ({post.items.length} items)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {post.items.map((item, idx) => (
                            <div key={idx} className="aspect-square bg-base-300 rounded overflow-hidden">
                              {item.contentType?.startsWith('image/') ? (
                                <img src={item.url} className="w-full h-full object-cover" alt="" />
                              ) : item.contentType?.startsWith('video/') ? (
                                <video src={item.url} className="w-full h-full object-cover" controls />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center flex-col">
                                  <FileText className="w-8 h-8 text-base-content/60" />
                                  <span className="text-xs text-center mt-1">{item.contentType}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="stat bg-base-100 rounded-lg">
                        <div className="stat-title">Post ID</div>
                        <div className="stat-value text-sm">{post._id}</div>
                      </div>
                      <div className="stat bg-base-100 rounded-lg">
                        <div className="stat-title">Created</div>
                        <div className="stat-value text-sm">{new Date(post.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="stat bg-base-100 rounded-lg">
                        <div className="stat-title">Expires</div>
                        <div className="stat-value text-sm">{new Date(post.expiresAt).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="p-3 bg-base-100 rounded-lg">
                        <h4 className="font-semibold mb-3">Comments ({post.comments.length})</h4>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {post.comments.map(comment => (
                            <div key={comment._id} className="bg-base-200 p-3 rounded">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{comment.user?.fullName}</span>
                                  <span className="text-xs text-base-content/60">{new Date(comment.createdAt).toLocaleString()}</span>
                                </div>
                                <button
                                  className="btn btn-xs btn-error btn-outline"
                                  onClick={() => deleteComment(post._id, comment._id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-sm text-base-content/80 mb-2">{comment.text}</p>
                              {comment.likes?.length > 0 && (
                                <div className="text-xs text-base-content/60 mb-2">Likes: {comment.likes.length}</div>
                              )}
                              {renderReplies(comment.replies, post._id, comment._id)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Edit Modal Component
function EditModal({ editModal, setEditModal, handleUpdate }) {
  const [formData, setFormData] = useState(editModal.data);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState(null);

  // Handle change admin modal
  if (editModal.type === 'change-admin') {
    const activeMembers = (editModal.data.members || []).filter(m => m && m._id && m.fullName);

    return (
      <dialog className="modal modal-open">
        <div className="modal-box">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">Change Group Admin</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setEditModal(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="alert alert-info">
              <Info className="w-5 h-5" />
              <span>Select a new admin for "{editModal.data.name}"</span>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Current Admin</span>
              </label>
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <Avatar
                  src={editModal.data.currentAdmin?.profilePic}
                  name={editModal.data.currentAdmin?.fullName || 'Unknown'}
                  size="w-10 h-10"
                />
                <span className="font-medium">{editModal.data.currentAdmin?.fullName || 'Unknown'}</span>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Select New Admin</span>
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeMembers.map((member) => (
                  <div
                    key={member._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedNewAdmin === member._id
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-200 hover:bg-base-300'
                      }`}
                    onClick={() => setSelectedNewAdmin(member._id)}
                  >
                    <Avatar
                      src={member.profilePic}
                      name={member.fullName}
                      size="w-10 h-10"
                    />
                    <span className="font-medium flex-1">{member.fullName}</span>
                    {selectedNewAdmin === member._id && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={() => setEditModal(null)}>Cancel</button>
            <button
              type="button"
              className="btn btn-warning"
              disabled={!selectedNewAdmin}
              onClick={async () => {
                if (!selectedNewAdmin) return;
                try {
                  await axiosInstance.patch(`/api/admin/groups/${editModal.id}`, {
                    admin: selectedNewAdmin
                  });
                  toast.success('Admin changed successfully');
                  setEditModal(null);
                  window.location.reload();
                } catch (err) {
                  toast.error('Failed to change admin');
                  console.error(err);
                }
              }}
            >
              <Crown className="w-4 h-4" />
              Change Admin
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setEditModal(null)}>close</button>
        </form>
      </dialog>
    );
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Edit {editModal.type.slice(0, -1)}</h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={() => setEditModal(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleUpdate} className="space-y-4">
          {Object.keys(formData).map((key) => (
            <div key={key} className="form-control">
              <label className="label">
                <span className="label-text capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
              {key === 'isBanned' ? (
                <select
                  className="select select-bordered w-full"
                  value={formData[key]}
                  onChange={(e) => {
                    const newData = { ...formData, [key]: e.target.value === 'true' };
                    setFormData(newData);
                    editModal.data = newData;
                  }}
                >
                  <option value="false">Active</option>
                  <option value="true">Banned</option>
                </select>
              ) : key === 'role' ? (
                <select
                  className="select select-bordered w-full"
                  value={formData[key]}
                  onChange={(e) => {
                    const newData = { ...formData, [key]: e.target.value };
                    setFormData(newData);
                    editModal.data = newData;
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              ) : key === 'description' || key === 'text' ? (
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={formData[key]}
                  onChange={(e) => {
                    const newData = { ...formData, [key]: e.target.value };
                    setFormData(newData);
                    editModal.data = newData;
                  }}
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={formData[key]}
                  onChange={(e) => {
                    const newData = { ...formData, [key]: e.target.value };
                    setFormData(newData);
                    editModal.data = newData;
                  }}
                />
              )}
            </div>
          ))}
          <div className="modal-action">
            <button type="button" className="btn" onClick={() => setEditModal(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setEditModal(null)}>close</button>
      </form>
    </dialog>
  );
}

// Delete Confirmation Modal
function DeleteModal({ deleteModal, setDeleteModal, handleDelete }) {
  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg text-error">Confirm Deletion</h3>
        <p className="py-4 text-base-content/70">
          Are you sure you want to delete <strong className="text-base-content">{deleteModal.name}</strong>? This action cannot be undone.
        </p>
        <div className="modal-action">
          <button className="btn" onClick={() => setDeleteModal(null)}>Cancel</button>
          <button className="btn btn-error" onClick={handleDelete}>Delete</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setDeleteModal(null)}>close</button>
      </form>
    </dialog>
  );
}


// Announcements View
function AnnouncementsView({ announcements, setDeleteModal, setIsAnnouncementModalOpen, onEditAnnouncement }) {
  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Announcements Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Create and manage announcements for users</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="stats shadow">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{announcements.length}</div>
                </div>
              </div>
              <button
                className="btn btn-primary gap-2"
                onClick={() => setIsAnnouncementModalOpen(true)}
              >
                <Megaphone className="w-4 h-4" />
                <span className="hidden sm:inline">New Announcement</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      {announcements.length === 0 ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body text-center py-12">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-base-content/30" />
            <p className="text-base-content/60">No announcements yet</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {announcements.map((announcement) => {
            // Determine banner color based on priority
            const bannerColor =
              announcement.priority === 'alert' ? 'bg-gradient-to-r from-error to-error/80' :
                announcement.priority === 'warning' ? 'bg-gradient-to-r from-warning to-warning/80' :
                  'bg-gradient-to-r from-primary to-primary/80';

            const iconColor =
              announcement.priority === 'alert' ? 'text-error' :
                announcement.priority === 'warning' ? 'text-warning' :
                  'text-primary';

            const priorityLabel =
              announcement.priority === 'alert' ? 'Alert' :
                announcement.priority === 'warning' ? 'Warning' :
                  'Info';

            const PriorityIcon =
              announcement.priority === 'alert' ? Bell :
                announcement.priority === 'warning' ? Bell :
                  Bell;

            return (
              <div key={announcement._id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Banner Header - Use actual banner image if available */}
                {announcement.bannerImage ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={announcement.bannerImage}
                      alt={announcement.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay gradient for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg md:text-xl line-clamp-2 mb-2">
                            {announcement.title}
                          </h3>
                          <span className="badge badge-sm bg-white/30 backdrop-blur-sm border-white/50 text-white gap-1">
                            <PriorityIcon className="w-3 h-3" />
                            {priorityLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`${bannerColor} p-4 md:p-6 text-white relative overflow-hidden h-48`}>
                    <div className="absolute top-0 right-0 opacity-10">
                      <Megaphone className="w-32 h-32 transform rotate-12" />
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-end">
                      <h3 className="font-bold text-lg md:text-xl line-clamp-2 mb-2">
                        {announcement.title}
                      </h3>
                      <span className="badge badge-sm bg-white/30 backdrop-blur-sm border-white/50 text-white w-fit gap-1">
                        <PriorityIcon className="w-3 h-3" />
                        {priorityLabel}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Body */}
                <div className="card-body p-4 md:p-6">
                  {/* Content */}
                  <div className="mb-4">
                    <p className="text-sm md:text-base text-base-content/80 whitespace-pre-wrap line-clamp-4">
                      {announcement.content}
                    </p>
                  </div>

                  {/* Footer Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-base-300">
                    <div className="flex items-center gap-2 text-xs md:text-sm text-base-content/60">
                      <div className={`w-2 h-2 rounded-full ${iconColor.replace('text-', 'bg-')} animate-pulse`}></div>
                      <span>Posted {new Date(announcement.createdAt).toLocaleDateString()}</span>
                      <span className="hidden sm:inline">at {new Date(announcement.createdAt).toLocaleTimeString()}</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        className="btn btn-xs md:btn-sm btn-ghost gap-1"
                        onClick={() => onEditAnnouncement(announcement)}
                      >
                        <Edit className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn btn-xs md:btn-sm btn-error btn-ghost gap-1"
                        onClick={() => setDeleteModal({ type: 'announcements', id: announcement._id, name: announcement.title })}
                      >
                        <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// Follow Leaderboard View
function FollowLeaderboardView({ leaderboard, limit, setLimit, onRefresh, loading }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base md:text-lg font-semibold">Follow Leaderboard</h2>
              <p className="text-sm text-base-content/60">Top users by follower count</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="select select-bordered select-sm"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>Top 10</option>
                <option value={25}>Top 25</option>
                <option value={50}>Top 50</option>
                <option value={100}>Top 100</option>
              </select>
              <button className="btn btn-sm btn-outline" onClick={onRefresh}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th className="text-xs md:text-sm">Rank</th>
                    <th className="text-xs md:text-sm">User</th>
                    <th className="text-xs md:text-sm">Email</th>
                    <th className="text-xs md:text-sm">Username</th>
                    <th className="text-xs md:text-sm text-right">Followers</th>
                    <th className="text-xs md:text-sm text-right">Following</th>
                  </tr>
                </thead>
                <tbody>
                  {[...leaderboard].sort((a, b) => b.followersCount - a.followersCount).map((user, index) => (
                    <tr key={user._id} className="hover">
                      <td className="font-semibold">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          {index > 2 && <span className="text-base-content/60">#{index + 1}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.profilePic}
                            name={user.fullName}
                            alt={user.fullName}
                            size="w-10 h-10"
                          />
                          <div>
                            <div className="font-semibold text-sm">{user.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs md:text-sm text-base-content/70">{user.email}</td>
                      <td className="text-xs md:text-sm">
                        <span className="badge badge-ghost badge-sm">@{user.username}</span>
                      </td>
                      <td className="text-right">
                        <span className="badge badge-primary badge-lg font-semibold">
                          {user.followersCount}
                        </span>
                      </td>
                      <td className="text-right">
                        <span className="badge badge-ghost badge-lg">
                          {user.followingCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {leaderboard.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4 md:p-6">
            <h3 className="font-semibold mb-3">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Total Users</div>
                <div className="stat-value text-lg">{leaderboard.length}</div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Total Followers</div>
                <div className="stat-value text-lg">
                  {leaderboard.reduce((sum, u) => sum + u.followersCount, 0)}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Avg Followers</div>
                <div className="stat-value text-lg">
                  {Math.round(leaderboard.reduce((sum, u) => sum + u.followersCount, 0) / leaderboard.length)}
                </div>
              </div>
              <div className="stat bg-base-200 rounded-lg p-3">
                <div className="stat-title text-xs">Top User</div>
                <div className="stat-value text-lg text-primary">
                  {leaderboard[0]?.followersCount || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
