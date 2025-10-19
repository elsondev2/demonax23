import { X, User, Calendar, FileText, Trash2, Download, HardDrive, MapPin, Clock, Image as ImageIcon, Video, Music, Paperclip } from 'lucide-react';

export default function UploadDetailsModal({ upload, onClose, onDelete }) {
  if (!upload) return null;

  const handleDelete = () => {
    onDelete(upload);
    onClose();
  };

  const getKindColor = () => {
    if (upload.kind === 'message-attachment') return 'bg-primary/10 border-primary/20';
    if (upload.kind === 'message-image') return 'bg-secondary/10 border-secondary/20';
    if (upload.kind === 'message-audio') return 'bg-info/10 border-info/20';
    if (upload.kind === 'status-media') return 'bg-accent/10 border-accent/20';
    if (upload.kind === 'post-media') return 'bg-warning/10 border-warning/20';
    if (upload.kind === 'profile-picture') return 'bg-success/10 border-success/20';
    return 'bg-base-200';
  };

  const getKindIcon = () => {
    if (upload.kind.includes('audio')) return <Music className="w-5 h-5 text-info" />;
    if (upload.kind.includes('image') || upload.kind.includes('picture')) return <ImageIcon className="w-5 h-5 text-secondary" />;
    if (upload.kind.includes('video')) return <Video className="w-5 h-5 text-accent" />;
    return <Paperclip className="w-5 h-5 text-primary" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 bg-base-100">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-base-300 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`p-1.5 sm:p-2 rounded-full ${getKindColor()} flex items-center justify-center`}>
                  {getKindIcon()}
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content truncate">
                  {upload.filename || upload.url?.split('/').pop() || 'Upload Details'}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{upload.user?.fullName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{new Date(upload.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={`badge badge-sm ${
                  upload.kind === 'message-attachment' ? 'badge-primary' :
                  upload.kind === 'message-image' ? 'badge-secondary' :
                  upload.kind === 'message-audio' ? 'badge-info' :
                  upload.kind === 'status-media' ? 'badge-accent' :
                  upload.kind === 'post-media' ? 'badge-warning' :
                  upload.kind === 'profile-picture' ? 'badge-success' : 'badge-ghost'
                }`}>
                  {upload.kind.replace(/-/g, ' ').toUpperCase()}
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
                      <Download className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Media Preview
                    </h4>
                    <div className="bg-base-200 rounded-lg overflow-hidden">
                      {upload.contentType?.startsWith('image/') || upload.kind.includes('picture') ? (
                        <img src={upload.url} alt="Preview" className="w-full h-auto" />
                      ) : upload.contentType?.startsWith('video/') ? (
                        <video src={upload.url} className="w-full h-auto" controls />
                      ) : upload.contentType?.startsWith('audio/') || upload.kind.includes('audio') ? (
                        <div className="p-8">
                          <div className="flex items-center gap-4 p-4 bg-base-100 rounded-lg mb-4">
                            <div className="w-16 h-16 bg-info/20 rounded-full flex items-center justify-center">
                              <Music className="w-8 h-8 text-info" />
                            </div>
                            <div>
                              <div className="font-medium">
                                {upload.kind === 'message-audio' ? 'Voice Message' : 'Audio File'}
                              </div>
                              <div className="text-sm text-base-content/60">
                                {upload.contentType || 'Audio file'}
                                {upload.duration && ` • ${upload.duration.toFixed(1)}s`}
                              </div>
                            </div>
                          </div>
                          <audio src={upload.url} className="w-full" controls />
                        </div>
                      ) : (
                        <div className="w-full aspect-video flex items-center justify-center flex-col p-8">
                          <FileText className="w-16 h-16 text-base-content/40 mb-4" />
                          <div className="font-medium mb-2">File Download</div>
                          <div className="text-sm text-base-content/60 mb-4">
                            {upload.contentType || 'Unknown file type'}
                          </div>
                          <a
                            href={upload.url}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-primary gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download File
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Usage Information */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4 sm:p-6">
                    <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      Where This Upload Is Used
                    </h4>
                    <div className="alert alert-info">
                      <MapPin className="w-5 h-5" />
                      <div className="flex-col items-start w-full">
                        <div className="text-sm">
                          {upload.kind === 'message-attachment' && (
                            <div>
                              <p className="mb-2">This file was sent as an attachment in a {upload.where?.type === 'group-message' ? `group message in "${upload.where?.name}"` : 'direct message'}.</p>
                              {upload.sender && upload.receiver && (
                                <div className="flex items-center gap-2 text-xs bg-base-100 p-2 rounded mt-2">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">{upload.sender.fullName}</span>
                                  <span>→</span>
                                  <span className="font-medium">{upload.receiver.fullName}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {upload.kind === 'message-image' && (
                            <div>
                              <p className="mb-2">This image was sent in a {upload.where?.type === 'group-message' ? `group message in "${upload.where?.name}"` : 'direct message'}.</p>
                              {upload.sender && upload.receiver && (
                                <div className="flex items-center gap-2 text-xs bg-base-100 p-2 rounded mt-2">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">{upload.sender.fullName}</span>
                                  <span>→</span>
                                  <span className="font-medium">{upload.receiver.fullName}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {upload.kind === 'message-audio' && (
                            <div>
                              <p className="mb-2">This voice message was sent in a {upload.where?.type === 'group-message' ? `group message in "${upload.where?.name}"` : 'direct message'}.</p>
                              {upload.sender && upload.receiver && (
                                <div className="flex items-center gap-2 text-xs bg-base-100 p-2 rounded mt-2">
                                  <User className="w-4 h-4" />
                                  <span className="font-medium">{upload.sender.fullName}</span>
                                  <span>→</span>
                                  <span className="font-medium">{upload.receiver.fullName}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {upload.kind === 'status-media' && (
                            <span>This media is used in a user status posted by {upload.user?.fullName}.</span>
                          )}
                          {upload.kind === 'status-audio' && (
                            <span>This audio is used as background music in a status posted by {upload.user?.fullName}.</span>
                          )}
                          {upload.kind === 'post-media' && (
                            <span>This media is item #{upload.where?.itemIndex + 1} in the post "{upload.where?.name}" by {upload.user?.fullName}.</span>
                          )}
                          {upload.kind === 'profile-picture' && (
                            <span>This is the profile picture for user {upload.where?.name}.</span>
                          )}
                          {upload.kind === 'group-picture' && (
                            <span>This is the group picture for "{upload.where?.name}".</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File URL */}
                {upload.url && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4 sm:p-6">
                      <h4 className="card-title text-sm sm:text-base mb-3">File URL</h4>
                      <div className="bg-base-200 p-3 rounded-lg">
                        <code className="text-xs break-all">{upload.url}</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-4">
                {/* Message Participants (for messages) */}
                {(upload.kind === 'message-attachment' || upload.kind === 'message-image' || upload.kind === 'message-audio') && upload.sender && upload.receiver && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Message Participants</h4>
                      
                      {/* Sender */}
                      <div className="mb-3">
                        <div className="text-xs text-base-content/60 mb-2">From:</div>
                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              <img src={upload.sender.profilePic || '/avatar.png'} alt="" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">{upload.sender.fullName}</div>
                            <div className="text-xs text-base-content/60 truncate">{upload.sender.email}</div>
                          </div>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center my-2">
                        <div className="text-base-content/40">↓</div>
                      </div>

                      {/* Receiver */}
                      <div>
                        <div className="text-xs text-base-content/60 mb-2">To:</div>
                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                          <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                              <img src={upload.receiver.profilePic || '/avatar.png'} alt="" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">{upload.receiver.fullName}</div>
                            <div className="text-xs text-base-content/60 truncate">{upload.receiver.email}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Information (for non-messages) */}
                {!(upload.kind === 'message-attachment' || upload.kind === 'message-image' || upload.kind === 'message-audio') && upload.user && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Uploaded By</h4>
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full">
                            <img src={upload.user.profilePic || '/avatar.png'} alt="" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{upload.user.fullName}</div>
                          <div className="text-sm text-base-content/60 truncate">{upload.user.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Details */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">File Details</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Content Type
                        </div>
                        <div className="text-sm">
                          {upload.contentType || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          File Size
                        </div>
                        <div className="text-sm">
                          {formatFileSize(upload.size)}
                        </div>
                      </div>
                      {upload.storageKey && (
                        <div>
                          <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <HardDrive className="w-3 h-3" />
                            Storage Key
                          </div>
                          <div className="text-xs font-mono bg-base-200 p-2 rounded break-all">
                            {upload.storageKey}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Uploaded
                        </div>
                        <div className="text-sm">
                          {new Date(upload.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Details */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Location</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Type
                        </div>
                        <div className="text-sm">
                          {upload.where?.type?.replace(/-/g, ' ') || 'Unknown'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Name
                        </div>
                        <div className="text-sm">
                          {upload.where?.name || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Reference ID
                        </div>
                        <div className="text-xs font-mono bg-base-200 p-2 rounded truncate">
                          {upload.where?.id ? String(upload.where.id).slice(-12) : 'N/A'}
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
              Delete Upload
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
