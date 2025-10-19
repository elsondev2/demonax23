import { useState } from 'react';
import { X, User, Calendar, Heart, MessageCircle, Image as ImageIcon, Trash2, FileText, Eye, Clock } from 'lucide-react';
import CommentsModal from './CommentsModal';

export default function PostDetailsModal({ post, onClose, onDelete, onRefresh }) {
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  if (!post) return null;

  const handleDelete = () => {
    onDelete({ type: 'posts', id: post._id, name: post.title || 'this post' });
    onClose();
  };

  const getVisibilityColor = () => {
    return post.visibility === 'public' ? 'bg-success/10 border-success/20' : 'bg-warning/10 border-warning/20';
  };

  const getVisibilityIcon = () => {
    return post.visibility === 'public' ? 'text-success' : 'text-warning';
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 bg-base-100">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-base-300 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`p-1.5 sm:p-2 rounded-full ${getVisibilityColor()} flex items-center justify-center`}>
                  <Eye className={`w-4 h-4 sm:w-5 sm:h-5 ${getVisibilityIcon()}`} />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content truncate">
                  {post.title || 'Post Details'}
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{post.postedBy?.fullName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
                <div className={`badge badge-sm ${post.visibility === 'public' ? 'badge-success' : 'badge-warning'}`}>
                  {post.visibility}
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
                {/* Post Media */}
                {post.items && post.items.length > 0 && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4 sm:p-6">
                      <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                        <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Media ({post.items.length} items)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  </div>
                )}

                {/* Caption */}
                {post.caption && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4 sm:p-6">
                      <h4 className="card-title flex items-center gap-2 mb-3 sm:mb-4 text-base sm:text-lg">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        Caption
                      </h4>
                      <div className="prose prose-sm sm:prose-base max-w-none">
                        <p className="text-sm sm:text-base text-base-content/80 leading-relaxed whitespace-pre-wrap">
                          {post.caption}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments Preview */}
                {post.comments && post.comments.length > 0 && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h4 className="card-title flex items-center gap-2 text-base sm:text-lg">
                          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          Comments ({post.comments.length})
                        </h4>
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => setShowCommentsModal(true)}
                        >
                          View All
                        </button>
                      </div>
                      <div className="space-y-3">
                        {post.comments.slice(0, 3).map(comment => (
                          <div key={comment._id} className="bg-base-200 p-3 rounded">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-sm">{comment.user?.fullName}</span>
                              <span className="text-xs text-base-content/60">{new Date(comment.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-base-content/80 line-clamp-2">{comment.text}</p>
                            {comment.likes?.length > 0 && (
                              <div className="text-xs text-base-content/60 mt-2 flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {comment.likes.length}
                              </div>
                            )}
                          </div>
                        ))}
                        {post.comments.length > 3 && (
                          <button
                            className="btn btn-sm btn-ghost w-full"
                            onClick={() => setShowCommentsModal(true)}
                          >
                            View all {post.comments.length} comments
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-4">
                {/* Author Information */}
                {post.postedBy && (
                  <div className="card bg-base-100 border border-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Author</h4>
                      <div className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <div className="avatar">
                          <div className="w-12 h-12 rounded-full">
                            <img src={post.postedBy.profilePic || '/avatar.png'} alt="" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{post.postedBy.fullName}</div>
                          <div className="text-sm text-base-content/60 truncate">{post.postedBy.email}</div>
                          <div className="text-xs text-base-content/50">Role: {post.postedBy.role || 'user'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-3 sm:mb-4 font-semibold">Engagement</h4>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="text-center p-2 sm:p-3 bg-error/10 rounded-lg border border-error/20">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Heart className="w-4 h-4 text-error" />
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-error">{post.likes?.length || 0}</div>
                        <div className="text-xs text-base-content/60">Likes</div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <MessageCircle className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-primary">{post.comments?.length || 0}</div>
                        <div className="text-xs text-base-content/60">Comments</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Details */}
                <div className="card bg-base-100 border border-base-200 shadow-sm">
                  <div className="card-body p-4">
                    <h4 className="card-title text-sm sm:text-base mb-4 font-semibold">Post Details</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Post ID
                        </div>
                        <div className="text-xs font-mono bg-base-200 p-2 rounded truncate">
                          {post._id}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1">
                          Visibility
                        </div>
                        <div className="text-sm">
                          {post.visibility}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created
                        </div>
                        <div className="text-sm">
                          {new Date(post.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-base-content/60 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires
                        </div>
                        <div className="text-sm">
                          {new Date(post.expiresAt).toLocaleString()}
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
              Delete Post
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      {showCommentsModal && (
        <CommentsModal
          post={post}
          onClose={() => setShowCommentsModal(false)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
