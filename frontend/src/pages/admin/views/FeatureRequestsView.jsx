import { useState } from "react";
import { Search, RefreshCw, MessageCircle } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import toast from "react-hot-toast";
import FeatureRequestModal from "../../../components/admin/FeatureRequestModal";
import DeclineConfirmationModal from "../../../components/admin/DeclineConfirmationModal";

export default function FeatureRequestsView({ requests, loading, onRefresh, setDeleteModal }) {
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
