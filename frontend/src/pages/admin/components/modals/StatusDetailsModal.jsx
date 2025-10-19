import { X, User, Calendar, Image as ImageIcon, Video, Trash2, FileText } from 'lucide-react';

export default function StatusDetailsModal({ status, onClose, onDelete }) {
  if (!status) return null;

  const handleDelete = () => {
    onDelete({ type: 'statuses', id: status._id, name: 'this status' });
    onClose();
  };

  const getMediaTypeIcon = () => {
    if (status.mediaType === 'image') return <ImageIcon className="w-5 h-5 text-secondary" />;
    if (status.mediaType === 'video') return <Video className="w-5 h-5 text-accent" />;
    return <FileText className="w-5 h-5 text-base-content/40" />;
  };

  const getMediaTypeBg = () => {
    if (status.mediaType === 'image') return 'bg-secondary/10 border-secondary/20';
    if (status.mediaType === 'video') return 'bg-accent/10 border-accent/20';
    return 'bg-base-200';
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 bg-base-100">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-base-300 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`p-1.5 sm:p-2 rounded-full ${getMediaTypeBg()} flex items-center justify-center`}>
                  {getMediaTypeIcon()}
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content">
                  Status Details
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className={!status.userId?.fullName ? 'italic' : ''}>
                    {status.userId?.fullName || 'Deleted User'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{new Date(status.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={`badge badge-sm ${status.mediaType === 'image' ? 'badge-secondary' :
                  status.mediaType === 'video' ? 'badge-accent' : 'badge-ghost'
                  }`}>
                  {status.mediaType?.toUpperCase() || 'UNKNOWN'}
                </div>
              </div>
            </div>
            <button className="btn btn-sm btn-circle btn-ghost flex-shrink-0" onClick={onClose}>
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Media Preview */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4 sm:p-6">
                    <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                      {getMediaTypeIcon()}
                      Media Preview
                    </h4>
                    <div className="bg-base-200 rounded-lg overflow-hidden">
                      {status.mediaType === 'image' ? (
                        <img src={status.mediaUrl} alt="" className="w-full h-auto" />
                      ) : status.mediaType === 'video' ? (
                        <video src={status.mediaUrl} className="w-full h-auto" controls />
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center">
                          <FileText className="w-16 h-16 text-base-content/40" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Caption */}
                {status.caption && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4 sm:p-6">
                      <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Caption
                      </h4>
                      <div className="prose prose-sm sm:prose-base max-w-none">
                        <p className="text-sm sm:text-base text-base-content/80 leading-relaxed whitespace-pre-wrap">
                          {status.caption}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Media URL */}
                {status.mediaUrl && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4 sm:p-6">
                      <h4 className="card-title text-sm sm:text-base mb-3">Media URL</h4>
                      <div className="bg-base-200 p-3 rounded-lg">
                        <code className="text-xs break-all">{status.mediaUrl}</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-4">
                {/* User Information */}
                {status.userId && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">User Information</h4>
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full">
                            <img src={status.userId.profilePic || '/avatar.png'} alt="" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{status.userId.fullName}</div>
                          <div className="text-sm text-base-content/60 truncate">{status.userId.email}</div>
                          <div className="text-xs text-base-content/50">Role: {status.userId.role || 'user'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Details */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Status Details</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Status ID
                        </div>
                        <div className="text-sm font-mono bg-base-200 p-2 rounded truncate">
                          {status._id}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Media Type
                        </div>
                        <div className="text-sm">
                          {status.mediaType || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Created
                        </div>
                        <div className="text-sm">
                          {new Date(status.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Updated
                        </div>
                        <div className="text-sm">
                          {new Date(status.updatedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-base-300 p-3 sm:p-4 bg-base-50/80 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <button className="btn btn-error btn-sm gap-2" onClick={handleDelete}>
              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              Delete Status
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
