import { useState } from 'react';
import { X, AlertTriangle, MessageSquare, Send, User, Calendar, ThumbsUp } from 'lucide-react';
import IOSModal from '../IOSModal';

export default function DeclineConfirmationModal({ request, onClose, onConfirm }) {
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!declineReason.trim()) {
      alert('Please provide a reason for declining this request.');
      return;
    }

    if (declineReason.length > 500) {
      alert('Reason must be less than 500 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(request._id, declineReason.trim());
      onClose();
    } catch (error) {
      alert('Failed to decline request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit();
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box w-full max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col p-0 bg-base-100">
        {/* Fixed Header - Mobile Optimized */}
        <div className="flex-shrink-0 border-b border-base-300 p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 flex-shrink-0 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-error" style={{ margin: 'auto' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-2xl font-bold text-base-content mb-1 sm:mb-2">
                Decline Feature Request
              </h3>
              <p className="text-sm sm:text-base text-base-content/70 leading-relaxed">
                Provide a clear reason for declining this request
              </p>
            </div>
            <button
              className="btn btn-sm btn-circle btn-ghost flex-shrink-0"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content - Mobile First */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Request Summary - Mobile Optimized */}
            <div className="card bg-gradient-to-br from-base-50 to-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="avatar flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" style={{ margin: 'auto' }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h4 className="text-base sm:text-lg font-bold text-base-content line-clamp-2">
                        {request.title}
                      </h4>
                      <div className="badge badge-primary badge-sm flex-shrink-0">
                        {request.category}
                      </div>
                    </div>

                    <p className="text-sm sm:text-base text-base-content/70 leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                      {request.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-base-content/60">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="truncate max-w-24 sm:max-w-none">{request.submittedBy?.fullName || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium text-success">+{request.upvotes}</span>
                        <span className="text-base-content/40">•</span>
                        <span className="font-medium text-error">-{request.downvotes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Reason Input Area */}
            <div className="card bg-base-100 border border-base-200 shadow-sm">
              <div className="card-body p-4 sm:p-6">
                <div className="flex items-center gap-2 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-error" style={{ margin: 'auto' }} />
                  </div>
                  <h4 className="card-title text-base sm:text-lg font-semibold">
                    Reason for Declining *
                  </h4>
                </div>

                <div className="space-y-4">
                  {/* Modern Textarea */}
                  <div className="relative">
                    <textarea
                      className="textarea textarea-bordered w-full resize-none focus:ring-2 focus:ring-error/25 focus:border-error/40 bg-base-50 border-base-300 rounded-xl text-sm sm:text-base"
                      rows="5"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Explain why this feature request cannot be implemented. Be specific about technical limitations, business reasons, or suggest alternatives..."
                      maxLength="500"
                      disabled={isSubmitting}
                    />

                    {/* Floating Character Counter */}
                    <div className="absolute bottom-3 right-3 text-xs text-base-content/50 bg-base-100 px-2 py-1 rounded-md border border-base-200">
                      {declineReason.length}/500
                    </div>
                  </div>

                  {/* Modern Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className={`font-medium ${
                        declineReason.length > 450 ? 'text-error' :
                        declineReason.length > 400 ? 'text-warning' : 'text-base-content/60'
                      }`}>
                        Character Count
                      </span>
                      <span className="text-base-content/50">
                        Press <kbd className="kbd kbd-xs mx-1">Ctrl</kbd>+<kbd className="kbd kbd-xs mx-1">Enter</kbd> to submit
                      </span>
                    </div>
                    <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          declineReason.length > 450 ? 'bg-error' :
                          declineReason.length > 400 ? 'bg-warning' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min((declineReason.length / 500) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guidelines - Mobile Optimized */}
            <div className="card bg-gradient-to-br from-info/5 to-info/10 border border-info/20">
              <div className="card-body p-4 sm:p-6">
                <h4 className="card-title text-info flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Guidelines for Declining
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm text-base-content/80">Be specific about technical or business limitations</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm text-base-content/80">Suggest alternative solutions when possible</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 bg-info rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm text-base-content/80">Keep tone professional and constructive</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 bg-warning rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-xs sm:text-sm text-warning font-medium">This reason will be visible to the user</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-Deletion Notice - Mobile Optimized */}
            <div className="card bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/25">
              <div className="card-body p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold text-warning mb-1 text-sm sm:text-base">Auto-Deletion Notice</div>
                    <div className="text-xs sm:text-sm text-base-content/80 leading-relaxed">
                      Declined requests are automatically deleted after 24 hours.
                      Ensure your reason is comprehensive and clear.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer - Mobile Optimized */}
        <div className="flex-shrink-0 border-t border-base-300 p-4 sm:p-6 bg-base-50/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            {/* Status Messages - Mobile First */}
            <div className="text-xs sm:text-sm text-center sm:text-left w-full sm:w-auto">
              {!declineReason.trim() && (
                <span className="text-error font-medium">
                  Please provide a reason before submitting
                </span>
              )}
              {declineReason.trim() && declineReason.length < 50 && (
                <span className="text-warning font-medium">
                  Consider adding more detail for clarity
                </span>
              )}
              {declineReason.trim() && declineReason.length >= 50 && (
                <span className="text-success font-medium">
                  Reason looks good!
                </span>
              )}
            </div>

            {/* Action Buttons - Mobile Optimized */}
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                className="btn btn-ghost btn-sm sm:btn-md flex-1 sm:flex-none px-4 sm:px-6"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="btn btn-error btn-sm sm:btn-md flex-1 sm:flex-none px-4 sm:px-6 gap-2"
                onClick={handleSubmit}
                disabled={!declineReason.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
                    <span className="hidden sm:inline">Declining...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Decline Request</span>
                    <span className="sm:hidden">Decline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}