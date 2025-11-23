import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ThumbsUp, ThumbsDown, TrendingUp, Users, ArrowLeft, Heart, CheckCircle, X } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { useSocket } from '../contexts/SocketContext';

const VotingPage = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [hasVoted, setHasVoted] = useState(false);
  const [myVote, setMyVote] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [reason, setReason] = useState('');
  const [stats, setStats] = useState(null);
  const [_loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);

  useEffect(() => {
    fetchMyVote();
    fetchStats();
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time vote updates
    socket.on('vote:update', (data) => {
      console.log('📊 Vote update received:', data);
      if (data.stats) {
        setStats(data.stats);
      }
    });

    return () => {
      socket.off('vote:update');
    };
  }, [socket]);

  const fetchMyVote = async () => {
    try {
      const res = await axiosInstance.get('/api/votes/my-vote');
      if (res.data.hasVoted) {
        setHasVoted(true);
        setMyVote(res.data.vote);
        setSelectedVote(res.data.vote.vote);
        setReason(res.data.vote.reason || '');
      }
    } catch (error) {
      console.error('Error fetching vote:', error);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/votes/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVote = async () => {
    if (!selectedVote) {
      toast.error('Please select a vote option');
      return;
    }

    setSubmitting(true);
    try {
      const res = await axiosInstance.post('/api/votes/submit', {
        vote: selectedVote,
        reason: reason.trim()
      });

      setHasVoted(true);
      setMyVote(res.data.vote);
      setStats(res.data.stats);
      setShowThankYou(true);
      setShowReasonModal(false);
      
      toast.success(hasVoted ? 'Vote updated successfully!' : 'Thank you for voting!', {
        icon: '✅'
      });

      // Hide thank you message after 3 seconds
      setTimeout(() => setShowThankYou(false), 3000);
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error(error.response?.data?.message || 'Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
      {/* Header */}
      <div className="bg-base-100/80 backdrop-blur-lg border-b border-base-300 z-10 shadow-lg flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm btn-circle hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Demonax Future Vote
              </h1>
              <p className="text-sm text-base-content/70">Your voice shapes our future</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-5xl pb-safe space-y-8">
        {/* Thank You Message */}
        {showThankYou && (
          <div className="alert alert-success shadow-2xl animate-bounce">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h3 className="font-bold">Thank You!</h3>
              <div className="text-sm">Your vote has been recorded. Together we shape Demonax's future!</div>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat bg-gradient-to-br from-base-100 to-base-200 shadow-2xl rounded-2xl border border-base-300">
              <div className="stat-figure text-primary">
                <Users className="w-10 h-10" />
              </div>
              <div className="stat-title text-xs font-semibold">Total Votes</div>
              <div className="stat-value text-3xl text-primary">{stats.totalVotes}</div>
              <div className="stat-desc">Monarcs have spoken</div>
            </div>

            <div className="stat bg-gradient-to-br from-success/10 to-success/5 shadow-2xl rounded-2xl border border-success/20">
              <div className="stat-figure text-success">
                <ThumbsUp className="w-10 h-10" />
              </div>
              <div className="stat-title text-xs font-semibold">Stay</div>
              <div className="stat-value text-3xl text-success">{stats.stayPercentage}%</div>
              <div className="stat-desc">{stats.stayVotes} votes</div>
            </div>

            <div className="stat bg-gradient-to-br from-error/10 to-error/5 shadow-2xl rounded-2xl border border-error/20">
              <div className="stat-figure text-error">
                <ThumbsDown className="w-10 h-10" />
              </div>
              <div className="stat-title text-xs font-semibold">Go</div>
              <div className="stat-value text-3xl text-error">{stats.goPercentage}%</div>
              <div className="stat-desc">{stats.goVotes} votes</div>
            </div>
          </div>
        )}

        {/* Voting Section */}
        <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
          <div className="card-body p-8">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">
                {hasVoted ? '✨ Your Vote' : '🗳️ Cast Your Vote'}
              </h2>
              <p className="text-base-content/70">
                {hasVoted ? 'You can update your vote anytime' : 'Help shape the future of Demonax'}
              </p>
            </div>

            <div className="alert bg-gradient-to-r from-info/20 to-primary/20 border-info/30 mb-8">
              <TrendingUp className="w-6 h-6 text-info" />
              <div>
                <h3 className="font-bold text-lg">Should Demonax Continue?</h3>
                <div className="text-sm mt-1">
                  We value your opinion! Let us know if you want Demonax to stay or if you think it's time to move on.
                </div>
              </div>
            </div>

            {/* Vote Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => setSelectedVote('stay')}
                disabled={submitting}
                className={`group relative card transition-all duration-300 cursor-pointer border-4 overflow-hidden ${
                  selectedVote === 'stay'
                    ? 'border-success bg-gradient-to-br from-success/20 to-success/10 shadow-2xl shadow-success/20'
                    : 'border-base-300 hover:border-success/50 bg-base-100'
                }`}
              >
                <div className="card-body items-center text-center p-8">
                  <div className={`p-4 rounded-full mb-4 transition-all ${
                    selectedVote === 'stay' ? 'bg-success/20' : 'bg-base-200 group-hover:bg-success/10'
                  }`}>
                    <ThumbsUp className={`w-16 h-16 transition-all ${
                      selectedVote === 'stay' ? 'text-success' : 'text-base-content/50 group-hover:text-success/70'
                    }`} />
                  </div>
                  <h3 className="card-title text-3xl mb-2">Stay</h3>
                  <p className="text-sm opacity-80">I want Demonax to continue</p>
                  {selectedVote === 'stay' && (
                    <div className="badge badge-success gap-2 mt-4">
                      <CheckCircle className="w-4 h-4" />
                      Selected
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedVote('go')}
                disabled={submitting}
                className={`group relative card transition-all duration-300 cursor-pointer border-4 overflow-hidden ${
                  selectedVote === 'go'
                    ? 'border-error bg-gradient-to-br from-error/20 to-error/10 shadow-2xl shadow-error/20'
                    : 'border-base-300 hover:border-error/50 bg-base-100'
                }`}
              >
                <div className="card-body items-center text-center p-8">
                  <div className={`p-4 rounded-full mb-4 transition-all ${
                    selectedVote === 'go' ? 'bg-error/20' : 'bg-base-200 group-hover:bg-error/10'
                  }`}>
                    <ThumbsDown className={`w-16 h-16 transition-all ${
                      selectedVote === 'go' ? 'text-error' : 'text-base-content/50 group-hover:text-error/70'
                    }`} />
                  </div>
                  <h3 className="card-title text-3xl mb-2">Go</h3>
                  <p className="text-sm opacity-80">I think it's time to move on</p>
                  {selectedVote === 'go' && (
                    <div className="badge badge-error gap-2 mt-4">
                      <CheckCircle className="w-4 h-4" />
                      Selected
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Tell us why button */}
            <button
              onClick={() => setShowReasonModal(true)}
              disabled={!selectedVote}
              className="btn btn-outline btn-primary w-full mb-4 gap-2"
            >
              <Heart className="w-5 h-5" />
              Tell us why (optional)
              {reason && <span className="badge badge-primary">{reason.length}</span>}
            </button>

            {/* Submit Button */}
            <button
              onClick={handleSubmitVote}
              disabled={!selectedVote || submitting}
              className={`btn btn-lg w-full text-lg gap-3 transition-all ${
                selectedVote === 'stay' ? 'btn-success' : selectedVote === 'go' ? 'btn-error' : 'btn-primary'
              } ${!selectedVote ? 'btn-disabled' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Submitting...
                </>
              ) : hasVoted ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Update Vote
                </>
              ) : (
                <>
                  <ThumbsUp className="w-6 h-6" />
                  Submit Vote
                </>
              )}
            </button>

            {hasVoted && myVote && (
              <div className="alert bg-gradient-to-r from-success/20 to-primary/20 border-success/30 mt-6">
                <CheckCircle className="w-6 h-6 text-success" />
                <div className="flex-1">
                  <div className="font-bold text-lg">
                    You voted: {myVote.vote === 'stay' ? '✅ Stay' : '❌ Go'}
                  </div>
                  <div className="text-sm opacity-80">Submitted on {formatDate(myVote.createdAt)}</div>
                  {myVote.updatedAt !== myVote.createdAt && (
                    <div className="text-xs opacity-70 mt-1">Last updated: {formatDate(myVote.updatedAt)}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300">
          <div className="card-body">
            <div className="alert bg-gradient-to-r from-info/20 to-primary/20 border-info/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6 text-info">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <div>
                <h3 className="font-bold text-lg">🔒 Your Vote is Private</h3>
                <div className="text-sm mt-1">
                  Only aggregate statistics are visible to other Monarcs. Individual votes and reasons are kept confidential.
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Reason Modal */}
      {showReasonModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl p-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 border-b border-base-300">
              <button
                onClick={() => setShowReasonModal(false)}
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-2xl text-base-content">Tell us why</h3>
                  <p className="text-sm text-base-content/70 mt-1">
                    Your feedback shapes Demonax's future
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="form-control w-full">
                <label className="label flex-col items-start gap-2 mb-2">
                  <span className="label-text font-medium text-base">Share your thoughts</span>
                  <span className="label-text-alt self-end">
                    <span className={`font-semibold ${reason.length > 450 ? 'text-warning' : reason.length > 0 ? 'text-primary' : 'text-base-content/60'}`}>
                      {reason.length}
                    </span>
                    <span className="text-base-content/60">/500</span>
                  </span>
                </label>
                
                <textarea
                  className="textarea textarea-bordered w-full h-56 text-base focus:textarea-primary resize-none leading-relaxed block"
                  placeholder="What do you think about Demonax? What features do you love? What could be improved? Your honest feedback helps us build a better platform for everyone..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 500))}
                  disabled={submitting}
                  autoFocus
                ></textarea>
                
                <div className="mt-3">
                  <span className="text-xs text-base-content/60">
                    💡 Be specific - your detailed feedback is valuable!
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-base-200 px-6 py-4 flex gap-3 justify-end border-t border-base-300">
              <button
                onClick={() => setShowReasonModal(false)}
                className="btn btn-ghost"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowReasonModal(false)}
                className="btn btn-primary gap-2"
                disabled={submitting}
              >
                <CheckCircle className="w-4 h-4" />
                Save Feedback
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop bg-black/50" onClick={() => setShowReasonModal(false)}>
            <button>close</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VotingPage;
