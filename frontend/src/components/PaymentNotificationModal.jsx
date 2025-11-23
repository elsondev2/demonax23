import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

const PaymentNotificationModal = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [hasSeenNotification, setHasSeenNotification] = useState(false);

  const TRIAL_END_DATE = new Date("2025-11-28T23:59:59");
  const NOTIFICATION_KEY = "payment_notification_seen";
  const LAST_NOTIFICATION_KEY = "last_payment_notification";

  useEffect(() => {
    const checkAndShowNotification = () => {
      const now = new Date();
      const hasSeenBefore = localStorage.getItem(NOTIFICATION_KEY);
      const lastNotification = localStorage.getItem(LAST_NOTIFICATION_KEY);
      
      // Check if trial has ended
      if (now > TRIAL_END_DATE) {
        // After Nov 28, always show (handled by PaymentBlockScreen)
        return;
      }

      // Before Nov 28, show notification logic
      if (!hasSeenBefore) {
        // First time seeing notification
        setIsVisible(true);
        setHasSeenNotification(false);
        return;
      }

      // Check if we should show daily notifications
      if (lastNotification) {
        const lastNotificationDate = new Date(lastNotification);
        const hoursSinceLastNotification = (now - lastNotificationDate) / (1000 * 60 * 60);
        
        // Show notification twice daily (every 12 hours)
        if (hoursSinceLastNotification >= 12) {
          setIsVisible(true);
        }
      }
    };

    checkAndShowNotification();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (!hasSeenNotification) {
      localStorage.setItem(NOTIFICATION_KEY, "true");
      setHasSeenNotification(true);
    }
    localStorage.setItem(LAST_NOTIFICATION_KEY, new Date().toISOString());
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
        <div className="bg-warning text-warning-content p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaExclamationTriangle size={24} />
            <h2 className="text-xl font-bold">Payment Required Soon</h2>
          </div>
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-circle">
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

          <div className="alert alert-warning">
            <div className="text-sm">
              Your free trial ends on <strong>November 28, 2025</strong>. 
              After this date, you'll need an active subscription to continue using Demonax as a Monarc.
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold">What happens next?</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Continue using the app for free until Nov 28</li>
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
