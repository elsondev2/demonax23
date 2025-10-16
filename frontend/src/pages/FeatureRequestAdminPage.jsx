import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, Edit, Trash2, CheckCircle, XCircle, Clock, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';
import { axiosInstance } from '../lib/axios';
import { useToast } from '../hooks/useToast';
import { useSocket } from '../contexts/SocketContext';

const FeatureRequestAdminPage = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { showToast } = useToast();

  // State management
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    implemented: 0,
    avgVotes: 0
  });

  // Fetch feature requests
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/feature-requests/admin/all');

      if (response.data.success) {
        setRequests(response.data.requests || []);

        // Calculate statistics
        const total = response.data.requests.length;
        const pending = response.data.requests.filter(r => r.status === 'pending').length;
        const approved = response.data.requests.filter(r => r.status === 'approved').length;
        const implemented = response.data.requests.filter(r => r.status === 'implemented').length;
        const avgVotes = total > 0 ?
          Math.round(response.data.requests.reduce((acc, r) => acc + (r.upvotes - r.downvotes), 0) / total) : 0;

        setStats({ total, pending, approved, implemented, avgVotes });
      } else {
        setError('Failed to load feature requests.');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load feature requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Socket.io real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleVoteUpdate = (updatedRequest) => {
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request._id === updatedRequest.id
            ? {
                ...request,
                upvotes: updatedRequest.upvotes,
                downvotes: updatedRequest.downvotes,
                voteScore: updatedRequest.voteScore
              }
            : request
        )
      );

      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        avgVotes: requests.length > 0 ?
          Math.round(requests.reduce((acc, r) => acc + (r.upvotes - r.downvotes), 0) / requests.length) : 0
      }));
    };

    const handleNewRequest = (newRequest) => {
      setRequests(prevRequests => [newRequest, ...prevRequests]);

      // Update stats
      setStats(prevStats => ({
        ...prevStats,
        total: prevStats.total + 1,
        pending: prevStats.pending + 1
      }));

      showToast('New feature request submitted!', 'info');
    };

    const handleStatusUpdate = (updatedRequest) => {
      setRequests(prevRequests =>
        prevRequests.map(request =>
          request._id === updatedRequest.id
            ? { ...request, status: updatedRequest.status }
            : request
        )
      );

      // Update stats based on status change
      setStats(prevStats => {
        const newStats = { ...prevStats };

        // Decrease count for old status
        if (updatedRequest.oldStatus) {
          newStats[updatedRequest.oldStatus] = Math.max(0, newStats[updatedRequest.oldStatus] - 1);
        }

        // Increase count for new status
        newStats[updatedRequest.status] = (newStats[updatedRequest.status] || 0) + 1;

        return newStats;
      });

      showToast(`Request status updated to: ${updatedRequest.status}`, 'success');
    };

    socket.on('featureRequest:vote', handleVoteUpdate);
    socket.on('featureRequest:new', handleNewRequest);
    socket.on('featureRequest:statusChange', handleStatusUpdate);

    return () => {
      socket.off('featureRequest:vote', handleVoteUpdate);
      socket.off('featureRequest:new', handleNewRequest);
      socket.off('featureRequest:statusChange', handleStatusUpdate);
    };
  }, [socket, showToast, requests.length]);

  // Update request status
  const updateStatus = async (requestId, newStatus) => {
    try {
      const response = await axiosInstance.patch(`/api/feature-requests/admin/${requestId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        showToast(`Request ${newStatus} successfully!`, 'success');
        fetchRequests(); // Refresh the list
      } else {
        showToast('Failed to update request status.', 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update request status.', 'error');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg mx-auto mb-4"></div>
          <p className="text-base-content/70">Loading feature requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="btn btn-ghost btn-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold">Feature Request Management</h1>
                <p className="text-sm text-base-content/70">Manage and moderate community feature requests</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title text-xs">Total Requests</div>
            <div className="stat-value text-2xl">{stats.total}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title text-xs">Pending Review</div>
            <div className="stat-value text-2xl text-warning">{stats.pending}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title text-xs">Approved</div>
            <div className="stat-value text-2xl text-success">{stats.approved}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title text-xs">Implemented</div>
            <div className="stat-value text-2xl text-info">{stats.implemented}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="card bg-base-200 shadow-lg mb-6">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-4">
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
                  <button className="btn btn-primary join-item">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  className="select select-bordered select-sm"
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
                  className="select select-bordered select-sm"
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
                  className="select select-bordered select-sm"
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

        {/* Error Display */}
        {error && (
          <div className="alert alert-error mb-6">
            <span>{error}</span>
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="card bg-base-200">
              <div className="card-body text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
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

                      <h3 className="text-lg font-semibold mb-2">{request.title}</h3>
                      <p className="text-sm text-base-content/70 mb-3">{request.description}</p>

                      <div className="flex items-center gap-4 text-xs text-base-content/60">
                        <span>By: {request.submittedBy?.fullName || 'Anonymous'}</span>
                        <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                        <span>Votes: 👍 {request.upvotes} 👎 {request.downvotes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => updateStatus(request._id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => updateStatus(request._id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}

                      {request.status === 'approved' && (
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => updateStatus(request._id, 'implemented')}
                        >
                          Mark Implemented
                        </button>
                      )}

                      {request.status === 'reviewing' && (
                        <>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => updateStatus(request._id, 'approved')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => updateStatus(request._id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                    </div>

                    <div className="text-xs text-base-content/60">
                      Last updated: {new Date(request.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureRequestAdminPage;