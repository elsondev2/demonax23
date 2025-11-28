import { useState, useEffect } from "react";
import { Grid3x3, ThumbsUp, ThumbsDown, CheckCircle, XCircle, Clock, Eye, Trash2, RefreshCw } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import Avatar from "../../../components/Avatar";
import PremiumBadge from "../../../components/PremiumBadge";
import toast from "react-hot-toast";

export default function AppRequestsView() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadRequests();
    loadStats();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/app-requests');
      setRequests(res.data.appRequests || []);
    } catch (error) {
      console.error('Failed to load app requests:', error);
      toast.error('Failed to load app requests');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axiosInstance.get('/api/app-requests/stats');
      setStats(res.data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const updateStatus = async (requestId, status) => {
    try {
      const res = await axiosInstance.patch(`/api/app-requests/${requestId}/status`, {
        status,
        adminNotes
      });
      if (res.data.success) {
        toast.success(`Status updated to ${status}`);
        loadRequests();
        loadStats();
        setSelectedRequest(null);
        setAdminNotes('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    try {
      const res = await axiosInstance.delete(`/api/app-requests/${requestId}`);
      if (res.data.success) {
        toast.success('Request deleted');
        loadRequests();
        loadStats();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'badge-neutral';
      case 'reviewing': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-error';
      case 'implemented': return 'badge-info';
      default: return 'badge-ghost';
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aVotes = (a.upvoteCount || 0) - (a.downvoteCount || 0);
    const bVotes = (b.upvoteCount || 0) - (b.downvoteCount || 0);
    return bVotes - aVotes;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Grid3x3 className="w-6 h-6 text-primary" />
                App Requests Management
              </h2>
              <p className="text-sm text-base-content/60">Manage community app integration requests</p>
            </div>
            <button className="btn btn-sm btn-outline gap-2" onClick={() => { loadRequests(); loadStats(); }}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="stats shadow stats-vertical sm:stats-horizontal w-full mt-4">
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Total</div>
                <div className="stat-value text-2xl">{stats.total}</div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Pending</div>
                <div className="stat-value text-2xl text-warning">{stats.pending}</div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Approved</div>
                <div className="stat-value text-2xl text-success">{stats.approved}</div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs">Implemented</div>
                <div className="stat-value text-2xl text-info">{stats.implemented}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'reviewing', 'approved', 'rejected', 'implemented'].map(status => (
              <button
                key={status}
                className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="badge badge-sm ml-1">
                  {status === 'all' ? requests.length : requests.filter(r => r.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : sortedRequests.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <Grid3x3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No app requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>App</th>
                    <th>Requester</th>
                    <th>Category</th>
                    <th>Votes</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRequests.map(request => {
                    const voteCount = (request.upvoteCount || 0) - (request.downvoteCount || 0);
                    return (
                      <tr key={request._id} className="hover">
                        <td>
                          <div className="font-semibold">{request.appName}</div>
                          <div className="text-xs text-base-content/60 line-clamp-1 max-w-xs">
                            {request.appDescription}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar
                              src={request.requestedBy?.profilePic}
                              name={request.requestedBy?.fullName}
                              size="w-8 h-8"
                              textSize="text-xs"
                            />
                            <div>
                              <div className="text-sm font-medium flex items-center gap-1">
                                {request.requestedBy?.fullName}
                                <PremiumBadge 
                                  tier={request.requestedBy?.subscriptionPlan || request.requestedBy?.premiumTier} 
                                  size="xs" 
                                />
                              </div>
                              <div className="text-xs text-base-content/60">{request.requestedBy?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-ghost badge-sm">{request.appCategory}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="text-success flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              {request.upvoteCount || 0}
                            </span>
                            <span className="text-error flex items-center gap-1">
                              <ThumbsDown className="w-3 h-3" />
                              {request.downvoteCount || 0}
                            </span>
                            <span className={`badge badge-sm ${voteCount > 0 ? 'badge-success' : voteCount < 0 ? 'badge-error' : 'badge-ghost'}`}>
                              {voteCount > 0 ? '+' : ''}{voteCount}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusColor(request.status)} badge-sm`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="text-xs text-base-content/60">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => setSelectedRequest(request)}
                              title="View & Manage"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              className="btn btn-xs btn-ghost text-error"
                              onClick={() => deleteRequest(request._id)}
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Manage App Request</h3>
            
            <div className="space-y-4">
              {/* App Info */}
              <div className="bg-base-200 p-4 rounded-lg">
                <h4 className="font-bold text-lg">{selectedRequest.appName}</h4>
                <p className="text-sm text-base-content/70 mt-1">{selectedRequest.appDescription}</p>
                {selectedRequest.appUrl && (
                  <a href={selectedRequest.appUrl} target="_blank" rel="noopener noreferrer" className="link link-primary text-sm mt-2 block">
                    {selectedRequest.appUrl}
                  </a>
                )}
                <div className="flex gap-2 mt-3">
                  <span className="badge badge-ghost">{selectedRequest.appCategory}</span>
                  <span className={`badge ${getStatusColor(selectedRequest.status)}`}>{selectedRequest.status}</span>
                </div>
              </div>

              {/* Requester */}
              <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                <Avatar
                  src={selectedRequest.requestedBy?.profilePic}
                  name={selectedRequest.requestedBy?.fullName}
                  size="w-12 h-12"
                />
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    {selectedRequest.requestedBy?.fullName}
                    <PremiumBadge 
                      tier={selectedRequest.requestedBy?.subscriptionPlan || selectedRequest.requestedBy?.premiumTier} 
                      size="sm" 
                    />
                  </div>
                  <div className="text-sm text-base-content/60">{selectedRequest.requestedBy?.email}</div>
                </div>
              </div>

              {/* Votes */}
              <div className="flex items-center gap-4 p-3 bg-base-200 rounded-lg">
                <div className="flex items-center gap-2 text-success">
                  <ThumbsUp className="w-5 h-5" />
                  <span className="font-bold">{selectedRequest.upvoteCount || 0}</span>
                  <span className="text-sm">upvotes</span>
                </div>
                <div className="flex items-center gap-2 text-error">
                  <ThumbsDown className="w-5 h-5" />
                  <span className="font-bold">{selectedRequest.downvoteCount || 0}</span>
                  <span className="text-sm">downvotes</span>
                </div>
              </div>

              {/* Admin Notes */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Admin Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  placeholder="Add notes about this request..."
                  value={adminNotes || selectedRequest.adminNotes || ''}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              {/* Status Actions */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Update Status</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-sm btn-warning" onClick={() => updateStatus(selectedRequest._id, 'reviewing')}>
                    <Clock className="w-4 h-4" /> Reviewing
                  </button>
                  <button className="btn btn-sm btn-success" onClick={() => updateStatus(selectedRequest._id, 'approved')}>
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button className="btn btn-sm btn-error" onClick={() => updateStatus(selectedRequest._id, 'rejected')}>
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button className="btn btn-sm btn-info" onClick={() => updateStatus(selectedRequest._id, 'implemented')}>
                    <CheckCircle className="w-4 h-4" /> Implemented
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button className="btn" onClick={() => { setSelectedRequest(null); setAdminNotes(''); }}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setSelectedRequest(null); setAdminNotes(''); }}></div>
        </div>
      )}
    </div>
  );
}
