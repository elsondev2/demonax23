import { useState } from 'react';
import { X, Bell, BellOff, Volume2, VolumeX } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useNotifications } from '../hooks/useNotifications';

function NotificationSettingsModal({ isOpen, onClose }) {
  const { isSoundEnabled, toggleSound } = useChatStore();
  const {
    isNotificationSupported,
    notificationPermission,
    requestPermission
  } = useNotifications();

  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    await requestPermission();
    setIsRequesting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Browser Notifications */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Browser Notifications</h3>
            <p className="text-sm text-base-content/70">
              Get notified about new messages even when you're not viewing the app
            </p>

            {!isNotificationSupported ? (
              <div className="alert alert-warning">
                <BellOff className="w-5 h-5" />
                <span>Browser notifications are not supported in your browser</span>
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="alert alert-error">
                <BellOff className="w-5 h-5" />
                <div>
                  <div className="font-semibold">Notifications Blocked</div>
                  <div className="text-sm">
                    You've blocked notifications. Please enable them in your browser settings.
                  </div>
                </div>
              </div>
            ) : notificationPermission === 'granted' ? (
              <div className="alert alert-success">
                <Bell className="w-5 h-5" />
                <span>Notifications are enabled</span>
              </div>
            ) : (
              <button
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="btn btn-primary w-full"
              >
                {isRequesting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Requesting...
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    Enable Notifications
                  </>
                )}
              </button>
            )}
          </div>

          {/* Sound Settings */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Sound Notifications</h3>
            <p className="text-sm text-base-content/70">
              Play a sound when you receive new messages
            </p>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={isSoundEnabled}
                  onChange={toggleSound}
                />
                <span className="label-text flex items-center gap-2">
                  {isSoundEnabled ? (
                    <>
                      <Volume2 className="w-5 h-5" />
                      Sound Enabled
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-5 h-5" />
                      Sound Disabled
                    </>
                  )}
                </span>
              </label>
            </div>
          </div>

          {/* How it works */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">How it works</h3>
            <ul className="text-sm text-base-content/70 space-y-2 list-disc list-inside">
              <li>Notifications appear when you're not viewing the app</li>
              <li>Sounds play when you receive new messages</li>
              <li>Badge count shows total unread messages</li>
              <li>Click notifications to jump to the conversation</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-base-300">
          <button onClick={onClose} className="btn btn-block">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationSettingsModal;
