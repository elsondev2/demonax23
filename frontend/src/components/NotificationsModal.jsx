import React from "react";
import { XIcon, Bell, Loader2 } from "lucide-react";
import useFriendStore from "../store/useFriendStore";
import IOSModal from "./IOSModal";
import Avatar from "./Avatar";

const Row = ({ avatar, title, subtitle, right }) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/40 hover:bg-base-200/60 transition mb-2">
    <div className="flex items-center gap-3 min-w-0">
      <Avatar
        src={avatar}
        name={title}
        alt={title}
        size="w-10 h-10"
      />
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && <div className="text-xs text-base-content/60 truncate">{subtitle}</div>}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
  </div>
);

function NotificationsModal({ isOpen, onClose }) {
  const { requests, acceptRequest, rejectRequest, fetchRequests } = useFriendStore();
  const [pending, setPending] = React.useState({});

  React.useEffect(() => { if (isOpen) fetchRequests().catch(() => { }); }, [isOpen, fetchRequests]);

  const setLoading = (key, label) => setPending(prev => ({ ...prev, [key]: label }));
  const clearLoading = (key) => setPending(prev => { const n = { ...prev }; delete n[key]; return n; });
  const isLoading = (key) => !!pending[key];

  const incoming = requests?.incomingPending || [];

  const modalContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-base-content">Notifications</h3>
        </div>
        <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto flex-1">
        {incoming.length === 0 && (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
            <div className="text-sm text-base-content/70">No new friend requests</div>
          </div>
        )}
        {incoming.map(req => (
          <Row key={req._id}
            avatar={req.from?.profilePic}
            title={req.from?.fullName}
            subtitle={req.from?.email}
            right={
              <div className="flex gap-2">
                <button className={`btn btn-xs btn-primary ${isLoading(req._id) ? 'btn-disabled' : ''}`} disabled={isLoading(req._id)} onClick={async () => { setLoading(req._id, 'Accepting...'); await acceptRequest(req._id, req.from._id); await fetchRequests(); clearLoading(req._id); }}>
                  {isLoading(req._id) ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    'Accept'
                  )}
                </button>
                <button className={`btn btn-xs btn-ghost ${isLoading(req._id) ? 'btn-disabled' : ''}`} disabled={isLoading(req._id)} onClick={async () => { setLoading(req._id, 'Rejecting...'); await rejectRequest(req._id, req.from._id); await fetchRequests(); clearLoading(req._id); }}>
                  {isLoading(req._id) ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    'Reject'
                  )}
                </button>
              </div>
            }
          />
        ))}
      </div>
    </>
  );

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-md mx-auto">
      <div className="flex flex-col h-full">
        {modalContent}
      </div>
    </IOSModal>
  );
}

export default NotificationsModal;
