import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FaTimes, FaGift } from "react-icons/fa";

// Trial end date - Christmas 2025!
const TRIAL_END_DATE = new Date("2025-12-25T23:59:59");
// Use sessionStorage so it shows once per login session
const SESSION_NOTIFICATION_KEY = "payment_notification_shown_this_session";

const PaymentNotificationModal = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkAndShowNotification = () => {
      const now = new Date();
      
      // Check if trial has ended
      if (now > TRIAL_END_DATE) {
        // After Dec 25, handled by PaymentBlockScreen
        return;
      }

      // Show notification once per session (every login)
      const hasSeenThisSession = sessionStorage.getItem(SESSION_NOTIFICATION_KEY);
      
      if (!hasSeenThisSession) {
        // Show notification on every new login/session
        setIsVisible(true);
      }
    };

    // Small delay to ensure smooth page load
    const timer = setTimeout(checkAndShowNotification, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Mark as seen for this session only - will show again on next login
    sessionStorage.setItem(SESSION_NOTIFICATION_KEY, "true");
  };

  const handleViewInstructions = () => {
    handleClose();
    navigate("/payment-instructions");
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const diffTime = TRIAL_END_DATE - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!isVisible) return null;

  const daysRemaining = getDaysRemaining();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-2xl max-w-md w-full animate-scale-in">
        <div className="bg-gradient-to-r from-red-600 to-green-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaGift size={24} />
            <h2 className="text-xl font-bold">🎄 Free Trial Extended!</h2>
          </div>
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-circle text-white hover:bg-white/20">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center">
            <div className="text-6xl font-bold text-primary mb-2">
              {daysRemaining}
            </div>
            <p className="text-lg font-semibold">
              {daysRemaining === 1 ? "Day" : "Days"} Remaining
            </p>
          </div>

          <div className="alert alert-info">
            <div className="text-sm">
              🎄 <strong>Extended until Christmas!</strong> Your free trial now ends on <strong>December 25, 2025</strong>. 
              After this date, you'll need an active subscription to continue using Demonax as a Monarc.
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">What happens next?</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>🎁 Enjoy free access until Christmas Day!</li>
              <li>Choose a plan that fits your needs</li>
              <li>Follow simple payment instructions</li>
              <li>Get instant access after verification</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleViewInstructions}
              className="btn btn-primary w-full"
            >
              View Payment Instructions
            </button>
            <button
              onClick={handleClose}
              className="btn btn-ghost w-full"
            >
              Remind Me Later
            </button>
          </div>

          <p className="text-xs text-center opacity-70">
            You'll receive daily reminders until you subscribe
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentNotificationModal;
