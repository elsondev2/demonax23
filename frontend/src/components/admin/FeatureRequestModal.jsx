import { useState } from 'react';
import { X, CheckCircle, XCircle, Calendar, User, Tag, AlertTriangle, MessageSquare, ThumbsUp, Clock } from 'lucide-react';

export default function FeatureRequestModal({ request, onClose, onUpdate, onDelete, onDeclineRequest }) {
  const [status, setStatus] = useState(request.status);
  const [category, setCategory] = useState(request.category);

  const handleApprove = async () => {
    try {
      await onUpdate(request._id, 'approve');
      onClose();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleDeclineClick = () => {
    onDeclineRequest(request);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatus(newStatus);
      await onUpdate(request._id, { status: newStatus, category });
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert status change on error
      setStatus(request.status);
    }
  };

  const handleDelete = () => {
    onDelete({ type: 'feature-requests', id: request._id, name: request.title });
    onClose();
  };

  const handleCategoryChange = async (newCategory) => {
    try {
      setCategory(newCategory);
      await onUpdate(request._id, { status, category: newCategory });
      onClose();
    } catch (error) {
      console.error('Failed to update category:', error);
      // Revert category change on error
      setCategory(request.category);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-warning',
      'reviewing': 'text-info',
      'approved': 'text-success',
      'denied': 'text-error',
      'implemented': 'text-primary'
    };
    return colors[status] || 'text-base-content';
  };

  const getStatusBgColor = (status) => {
    const colors = {
      'pending': 'bg-warning/10 border-warning/20',
      'reviewing': 'bg-info/10 border-info/20',
      'approved': 'bg-success/10 border-success/20',
      'denied': 'bg-error/10 border-error/20',
      'implemented': 'bg-primary/10 border-primary/20'
    };
    return colors[status] || 'bg-base-200';
  };

  const getCategoryColor = (category) => {
    const colors = {
      'bug': 'badge-error',
      'feature': 'badge-primary',
      'improvement': 'badge-secondary',
      'ui': 'badge-accent'
    };
    return colors[category] || 'badge-ghost';
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 bg-base-100">
        {/* Fixed Header - Mobile Optimized */}
        <div className="flex-shrink-0 border-b border-base-300 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`p-1.5 sm:p-2 rounded-full ${getStatusBgColor(request.status)} flex items-center justify-center`}>
                  <Tag className={`w-4 h-4 sm:w-5 sm:h-5 ${getStatusColor(request.status)}`} style={{ margin: 'auto' }} />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content truncate pr-2">
                  {request.title}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="truncate max-w-20 sm:max-w-none">{request.submittedBy?.fullName || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{request.upvotes - request.downvotes} votes</span>
                </div>
              </div>
            </div>
            <button className="btn btn-sm btn-circle btn-ghost flex-shrink-0" onClick={onClose}>
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content - Mobile First */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Description */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4 sm:p-6">
                    <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                      <div className="flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      Description
                    </h4>
                    <div className="prose prose-sm sm:prose-base max-w-none">
                      <p className="text-sm sm:text-base text-base-content/80 leading-relaxed whitespace-pre-wrap">
                        {request.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tags - Mobile Optimized */}
                {request.tags && request.tags.length > 0 && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4 sm:p-6">
                      <h4 className="card-title mb-3 sm:mb-4 text-base sm:text-lg">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.tags.map((tag, index) => (
                          <span key={index} className="badge badge-outline badge-sm font-medium text-xs sm:text-sm">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Denial Reason Display - Mobile Optimized */}
                {request.denialReason && (
                  <div className="card bg-gradient-to-br from-error/5 to-error/10 border border-error/20 shadow-sm">
                    <div className="card-body p-4 sm:p-6">
                      <h4 className="card-title text-error flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                        <div className="flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        Denial Reason
                      </h4>
                      <div className="bg-error/5 border-l-4 border-error/30 p-3 sm:p-4 rounded-r-lg mb-3 sm:mb-4">
                        <p className="text-sm sm:text-base text-base-content/80 leading-relaxed">
                          {request.denialReason}
                        </p>
                      </div>
                      {request.deniedBy && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-base-content/60 bg-base-100 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Denied by <strong>{request.deniedBy.fullName}</strong></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>{new Date(request.deniedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Mobile Optimized */}
              <div className="space-y-4 sm:space-y-4">
                {/* Current Status & Category */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Request Details</h4>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
                          Current Status
                        </div>
                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${getStatusBgColor(request.status)}`}>
                          <span className={getStatusColor(request.status)}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-2">
                          Category
                        </div>
                        <span className={`badge badge-sm sm:badge-md ${getCategoryColor(request.category)}`}>
                          {request.category.charAt(0).toUpperCase() + request.category.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Mobile Optimized */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-3 sm:mb-4 font-semibold">Quick Actions</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
                      <button
                        className="btn btn-success btn-sm w-full gap-2 justify-center font-medium text-xs sm:text-sm"
                        onClick={handleApprove}
                        disabled={request.status === 'approved' || request.status === 'implemented'}
                      >
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Approve Request</span>
                        <span className="sm:hidden">Approve</span>
                      </button>
                      <button
                        className="btn btn-error btn-sm w-full gap-2 justify-center font-medium text-xs sm:text-sm"
                        onClick={handleDeclineClick}
                        disabled={request.status === 'denied'}
                      >
                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Decline Request</span>
                        <span className="sm:hidden">Decline</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Voting Stats - Mobile Optimized */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-3 sm:mb-4 font-semibold">Community Feedback</h4>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="text-center p-2 sm:p-3 bg-success/10 rounded-lg border border-success/20">
                        <div className="text-lg sm:text-xl font-bold text-success">{request.upvotes}</div>
                        <div className="text-xs text-base-content/60">Upvotes</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-error/10 rounded-lg border border-error/20">
                        <div className="text-lg sm:text-xl font-bold text-error">{request.downvotes}</div>
                        <div className="text-xs text-base-content/60">Downvotes</div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-primary/10 rounded-lg border border-primary/20 text-center">
                      <div className="text-lg sm:text-xl font-bold text-primary">
                        {request.upvotes - request.downvotes}
                      </div>
                      <div className="text-xs text-base-content/60">Net Score</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer - Mobile Optimized */}
        <div className="flex-shrink-0 border-t border-base-300 p-3 sm:p-4 bg-base-50/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <button className="btn btn-error btn-sm gap-2 w-full sm:w-auto" onClick={handleDelete}>
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delete Request</span>
              <span className="sm:hidden">Delete</span>
            </button>

            <div className="flex gap-2 w-full sm:w-auto">
              <div className="dropdown dropdown-top dropdown-end">
                <button tabIndex={0} className="btn btn-ghost btn-sm w-full sm:w-auto">
                  <span className="hidden sm:inline">Change Status</span>
                  <span className="sm:hidden">Status</span>
                </button>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48 sm:w-52">
                  <li><a onClick={() => { handleStatusChange('pending'); onUpdate(request._id, { status: 'pending', category }); }}>Set as Pending</a></li>
                  <li><a onClick={() => { handleStatusChange('reviewing'); onUpdate(request._id, { status: 'reviewing', category }); }}>Set as Reviewing</a></li>
                  <li><a onClick={() => { handleStatusChange('approved'); onUpdate(request._id, { status: 'approved', category }); }}>Set as Approved</a></li>
                  <li><a onClick={() => { handleStatusChange('implemented'); onUpdate(request._id, { status: 'implemented', category }); }}>Set as Implemented</a></li>
                  <li><a onClick={() => { handleStatusChange('denied'); onUpdate(request._id, { status: 'denied', category }); }}>Set as Denied</a></li>
                </ul>
              </div>

              <div className="dropdown dropdown-top dropdown-end">
                <button tabIndex={0} className="btn btn-ghost btn-sm w-full sm:w-auto">
                  <span className="hidden sm:inline">Change Category</span>
                  <span className="sm:hidden">Category</span>
                </button>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-48 sm:w-52">
                  <li><a onClick={() => handleCategoryChange('bug')}>Bug Fix</a></li>
                  <li><a onClick={() => handleCategoryChange('feature')}>New Feature</a></li>
                  <li><a onClick={() => handleCategoryChange('improvement')}>Improvement</a></li>
                  <li><a onClick={() => handleCategoryChange('ui')}>UI/UX</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
