import { useState, useEffect } from 'react';
import { Vote, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { axiosInstance } from '../lib/axios';

const VoteNotification = () => {
  const navigate = useNavigate();
  const [hasVoted, setHasVoted] = useState(true); // Default to true to avoid flash
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkVoteStatus();
  }, []);

  const checkVoteStatus = async () => {
    try {
      const res = await axiosInstance.get('/api/votes/my-vote');
      setHasVoted(res.data.hasVoted);
      
      // Check if user dismissed this session
      const dismissedSession = sessionStorage.getItem('vote_notification_dismissed');
      if (dismissedSession) {
        setDismissed(true);
      }
    } catch (error) {
      console.error('Error checking vote status:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('vote_notification_dismissed', 'true');
  };

  const handleVote = () => {
    navigate('/vote');
  };

  // Don't show if user has voted or dismissed
  if (hasVoted || dismissed) {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slide-down">
      <div className="alert alert-warning shadow-2xl border-2 border-warning">
        <Vote className="w-6 h-6 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-bold text-sm">Vote for Demonax's Future!</h3>
          <div className="text-xs mt-1">
            Help us decide: Should Demonax stay or go? Your voice matters!
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleVote}
            className="btn btn-primary btn-sm"
          >
            Vote Now
          </button>
          <button
            onClick={handleDismiss}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoteNotification;
