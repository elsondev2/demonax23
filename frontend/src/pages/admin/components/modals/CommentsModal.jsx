import { useState } from 'react';
import { X, MessageCircle, Heart, Trash2, User, Calendar, ChevronRight } from 'lucide-react';
import { axiosInstance } from '../../../../lib/axios';
import toast from 'react-hot-toast';

export default function CommentsModal({ post, onClose, onRefresh }) {
  const [expandedReplies, setExpandedReplies] = useState(new Set());

  if (!post) return null;

  const toggleReplies = (commentId) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedReplies(newExpanded);
  };

  const deleteComment = async (commentId) => {
    try {
      await axiosInstance.delete(`/api/admin/posts/${post._id}/comments/${commentId}`);
      toast.success('Comment deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const deleteReply = async (commentId, replyId) => {
    try {
      await axiosInstance.delete(`/api/admin/posts/${post._id}/comments/${commentId}/replies/${replyId}`);
      toast.success('Reply deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete reply');
    }
  };

  const renderReplies = (replies, commentId, level = 1) => {
    if (!replies || replies.length === 0) return null;

    return (
      <div className={`ml-${Math.min(level * 4, 12)} mt-3 space-y-3 border-l-2 border-base-300 pl-4`}>
        {replies.map(reply => (
          <div key={reply._id} className="bg-base-100 p-3 rounded-lg border border-base-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="avatar">
                  <div className="w-8 h-8 rounded-full">
                    <img src={reply.user?.profilePic || '/avatar.png'} alt="" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{reply.user?.fullName || 'Unknown'}</div>
                  <div className="text-xs text-base-content/60 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(reply.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                className="btn btn-xs btn-error btn-outline"
                onClick={() => deleteReply(commentId, reply._id)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm text-base-content/80 leading-relaxed mb-2">{reply.text}</p>
            {reply.likes?.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-base-content/60">
                <Heart className="w-3 h-3 text-error" />
                <span>{reply.likes.length} {reply.likes.length === 1 ? 'like' : 'likes'}</span>
              </div>
            )}
            {reply.replies && reply.replies.length > 0 && renderReplies(reply.replies, commentId, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  const totalComments = post.comments?.length || 0;
  const totalReplies = post.comments?.reduce((acc, comment) => {
    const countReplies = (replies) => {
      if (!replies || replies.length === 0) return 0;
      return replies.length + replies.reduce((sum, reply) => sum + countReplies(reply.replies), 0);
    };
    return acc + countReplies(comment.replies);
  }, 0) || 0;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 bg-base-100">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-base-300 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 border-primary/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content">
                  Comments & Replies
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-base-content/60">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{post.postedBy?.fullName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{totalComments} comments, {totalReplies} replies</span>
                </div>
              </div>
              {post.title && (
                <div className="mt-2 text-sm font-medium text-base-content/80 truncate">
                  Post: {post.title}
                </div>
              )}
            </div>
            <button className="btn btn-sm btn-circle btn-ghost flex-shrink-0" onClick={onClose}>
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-4">
                {post.comments.map(comment => {
                  const hasReplies = comment.replies && comment.replies.length > 0;
                  const isExpanded = expandedReplies.has(comment._id);

                  return (
                    <div key={comment._id} className="card bg-base-200 border border-base-300 shadow-sm">
                      <div className="card-body p-4">
                        {/* Comment Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="avatar">
                              <div className="w-10 h-10 rounded-full">
                                <img src={comment.user?.profilePic || '/avatar.png'} alt="" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base truncate">{comment.user?.fullName || 'Unknown'}</div>
                              <div className="text-xs text-base-content/60 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(comment.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <button
                            className="btn btn-sm btn-error btn-outline"
                            onClick={() => deleteComment(comment._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Comment Text */}
                        <p className="text-sm sm:text-base text-base-content/90 leading-relaxed mb-3 whitespace-pre-wrap">
                          {comment.text}
                        </p>

                        {/* Comment Stats */}
                        <div className="flex items-center gap-4 mb-3">
                          {comment.likes?.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-base-content/60">
                              <Heart className="w-4 h-4 text-error" />
                              <span>{comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}</span>
                            </div>
                          )}
                          {hasReplies && (
                            <div className="flex items-center gap-1 text-sm text-base-content/60">
                              <MessageCircle className="w-4 h-4" />
                              <span>{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                            </div>
                          )}
                        </div>

                        {/* Toggle Replies Button */}
                        {hasReplies && (
                          <button
                            className="btn btn-xs btn-ghost gap-2 w-fit"
                            onClick={() => toggleReplies(comment._id)}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            {isExpanded ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                          </button>
                        )}

                        {/* Replies */}
                        {hasReplies && isExpanded && renderReplies(comment.replies, comment._id)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-base-200 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-base-content/40" />
                </div>
                <div className="text-lg font-medium">No comments yet</div>
                <div className="text-base-content/60 mt-2">This post doesn't have any comments</div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-base-300 p-3 sm:p-4 bg-base-50/80 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <div className="text-sm text-base-content/60">
              Total: {totalComments} comments, {totalReplies} replies
            </div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
