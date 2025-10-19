import { useEffect, useRef, useState, useCallback } from "react";
import { axiosInstance } from "../../lib/axios";
import { useAuthStore } from "../../store/useAuthStore";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router";
import { Users, MessageSquare, Layers, Image, LayoutDashboard, Download, FileText, Megaphone, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import AnnouncementModal from "../../components/AnnouncementModal";
import AppearanceModal from "../../components/AppearanceModal";

// Import extracted components
import { AdminSidebar, AdminHeader, LoadingSkeleton } from "./components";
import { EditModal, DeleteModal } from "./components/modals";
import {
  DashboardView,
  UsersView,
  MessagesView,
  GroupsView,
  CommunityGroupsView,
  PostsView,
  UploadsView,
  StatusesView,
  AnnouncementsView,
  FeatureRequestsView,
  FollowLeaderboardView
} from "./views";

export default function AdminPage() {
  const { authUser, socket } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Determine active tab from URL path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/admin' || path === '/admin/') return 'dashboard';
    const tab = path.replace('/admin/', '');
    return tab || 'dashboard';
  };

  const activeTab = getActiveTab();

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
  const [groupsPage, setGroupsPage] = useState(1);
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
  const [messagesSubTab, setMessagesSubTab] = useState('all');
  const [conversations, setConversations] = useState([]);
  const [conversationsPage, setConversationsPage] = useState(1);
  const [conversationsPerPage, setConversationsPerPage] = useState(50);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);

  // Groups subviews
  const [groupsSubTab, setGroupsSubTab] = useState('all');
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

      if (!error.response) {
        toast.error("Cannot connect to server. Please check if the backend is running.");
      } else if (error.response.status === 401) {
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
    const token = localStorage.getItem('jwt-token');

    if (!authUser && !token) {
      console.log("❌ No auth user and no token - redirecting to login");
      navigate('/admin/login');
      return;
    }

    if (!authUser && token) {
      console.log("⚠️ Token exists but no auth user - this might be a page refresh");
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
      if (deleteModal.type === 'announcements') {
        await axiosInstance.delete(`/api/notices/announcements/${deleteModal.id}`);
      } else if (deleteModal.type === 'feature-requests') {
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
    loadData();
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setIsAnnouncementModalOpen(true);
  };

  const handleEditSuccess = () => {
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

    if (isRightSwipe && touchStart < 50 && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }

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
      <AdminSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        tabs={tabs}
        authUser={authUser}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <AdminHeader
          activeTab={activeTab}
          tabs={tabs}
          setIsSidebarOpen={setIsSidebarOpen}
          onRefresh={loadData}
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-6">
            {loading ? (
              <LoadingSkeleton activeTab={activeTab} />
            ) : (
              <Routes>
                <Route index element={<DashboardView overview={overview} users={users} messages={messages} groups={groups} statuses={statuses} recentActivity={recentActivity} featureRequests={featureRequests} groupConversations={groupConversations} />} />
                <Route path="users" element={<UsersView users={users} setEditModal={setEditModal} setDeleteModal={setDeleteModal} />} />
                <Route path="messages" element={(
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
                )} />
                <Route path="groups" element={(
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
                    setPage={setGroupsPage}
                    perPage={groupsPerPage}
                    convPage={groupConvPage}
                    setConvPage={setGroupConvPage}
                    convPerPage={groupConvPerPage}
                    setConvPerPage={setGroupConvPerPage}
                    loading={loading}
                    groupThreadQ={groupThreadQ}
                    setGroupThreadQ={setGroupThreadQ}
                  />
                )} />
                <Route path="community" element={
                  <CommunityGroupsView
                    communityGroups={communityGroups}
                    loading={loading}
                    onRefresh={loadData}
                  />
                } />
                <Route path="posts" element={(
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
                )} />
                <Route path="uploads" element={
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
                } />
                <Route path="statuses" element={<StatusesView statuses={statuses} setDeleteModal={setDeleteModal} />} />
                <Route path="announcements" element={
                  <AnnouncementsView
                    announcements={announcements}
                    onRefresh={loadData}
                    setDeleteModal={setDeleteModal}
                    isAnnouncementModalOpen={isAnnouncementModalOpen}
                    setIsAnnouncementModalOpen={setIsAnnouncementModalOpen}
                    onEditAnnouncement={handleEditAnnouncement}
                  />
                } />
                <Route path="follow-leaderboard" element={
                  <FollowLeaderboardView
                    leaderboard={followLeaderboard}
                    limit={followLeaderboardLimit}
                    setLimit={setFollowLeaderboardLimit}
                    onRefresh={loadData}
                    loading={loading}
                  />
                } />
                <Route path="feature-requests" element={
                  <FeatureRequestsView
                    requests={featureRequests}
                    loading={featureRequestsLoading}
                    onRefresh={loadData}
                    setDeleteModal={setDeleteModal}
                  />
                } />
              </Routes>
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
