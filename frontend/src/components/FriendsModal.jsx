import React, { useEffect, useMemo, useState } from "react";
import { XIcon, UsersIcon, Loader2, CheckCircle2, XCircle, Send, Search, Inbox, ListChecks, Clock } from "lucide-react";
import useFriendStore from "../store/useFriendStore";
import { useChatStore } from "../store/useChatStore";
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
        <div className="text-sm font-medium text-base-content truncate">{title}</div>
        {subtitle && <div className="text-xs text-base-content/70 truncate">{subtitle}</div>}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">{right}</div>
  </div>
);

const FriendsModal = ({ isOpen, onClose }) => {
  const { requests, fetchRequests, acceptRequest, rejectRequest, sendRequest, cancelRequest } = useFriendStore();
  const { allContacts, getAllContacts } = useChatStore();

  const [tab, setTab] = useState("incoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [pending, setPending] = useState({}); // key -> label

  useEffect(() => {
    if (!isOpen) return;
    fetchRequests();
    getAllContacts();
  }, [isOpen, fetchRequests, getAllContacts]);

  if (!isOpen) return null;

  const setLoading = (key, label) => setPending(prev => ({ ...prev, [key]: label }));
  const clearLoading = (key) => setPending(prev => { const n = { ...prev }; delete n[key]; return n; });
  const isLoading = (key) => !!pending[key];

  const norm = s => (s || "").toLowerCase();
  const q = norm(searchTerm);

  const incoming = useMemo(() => (requests?.incomingPending || []).filter(r => norm(r.from?.fullName).includes(q) || norm(r.from?.email).includes(q)), [requests, q]);
  const outgoing = useMemo(() => (requests?.outgoingPending || []).filter(r => norm(r.to?.fullName).includes(q) || norm(r.to?.email).includes(q)), [requests, q]);
  const friends = useMemo(() => (requests?.friends || []).filter(u => norm(u.fullName).includes(q) || norm(u.email).includes(q)), [requests, q]);
  const rejected = useMemo(() => (requests?.rejected || []).filter(r => {
    const user = r.from?._id === requests?.me ? r.to : r.from; return norm(user?.fullName).includes(q);
  }), [requests, q]);
  const contacts = useMemo(() => (allContacts || []).filter(u => norm(u.fullName).includes(q) || norm(u.email).includes(q)), [allContacts, q]);

  const Tab = ({ id, label, count }) => (
    <button className={`tab text-base-content ${tab === id ? 'tab-active' : ''}`} onClick={() => setTab(id)}>
      <span className="inline-flex items-center gap-2">
        <span>{label}</span>
        <span className="badge badge-xs badge-primary">{count}</span>
      </span>
    </button>
  );

  const modalContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-base-300">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-base-content">Friends & Requests</h3>
        </div>
        <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose} aria-label="Close">
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Search + Tabs */}
      <div className="p-3 pt-4">
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/60" />
          <input className="input input-bordered w-full pl-9 placeholder-base-content/80" placeholder="Search requests, friends, contacts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="tabs tabs-boxed overflow-x-auto whitespace-nowrap">
          <Tab id="incoming" label="Incoming" count={incoming.length} />
          <Tab id="outgoing" label="Outgoing" count={outgoing.length} />
          <Tab id="friends" label="Friends" count={friends.length} />
          <Tab id="rejected" label="Rejected" count={rejected.length} />
          <Tab id="add" label="Add" count={contacts.length} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto flex-1">
        {tab === 'incoming' && (
          <div>
            {incoming.length === 0 ? (
              <div className="flex flex-col items-center text-base-content/70 py-10">
                <Inbox className="w-10 h-10 mb-2" />
                <div>No incoming requests</div>
              </div>
            ) : incoming.map(req => (
              <Row key={req._id}
                avatar={req.from?.profilePic}
                title={req.from?.fullName || "Unknown User"}
                subtitle={req.from?.email || ""}
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
        )}

        {tab === 'outgoing' && (
          <div>
            {outgoing.length === 0 ? (
              <div className="flex flex-col items-center text-base-content/70 py-10">
                <ListChecks className="w-10 h-10 mb-2" />
                <div>No outgoing requests</div>
              </div>
            ) : outgoing.map(req => (
              <Row key={req._id}
                avatar={req.to?.profilePic}
                title={req.to?.fullName || "Unknown User"}
                subtitle="Waiting for response"
                right={
                  <button className={`btn btn-xs btn-ghost ${isLoading(req._id) ? 'btn-disabled' : ''}`} disabled={isLoading(req._id)} onClick={async () => { setLoading(req._id, 'Cancelling...'); await cancelRequest(req._id, req.to._id); await fetchRequests(); clearLoading(req._id); }}>
                    {isLoading(req._id) ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Cancel'
                    )}
                  </button>
                }
              />
            ))}
          </div>
        )}

        {tab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="flex flex-col items-center text-base-content/70 py-10">
                <UsersIcon className="w-10 h-10 mb-2" />
                <div>No friends yet</div>
              </div>
            ) : friends.map(user => (
              <Row key={user._id}
                avatar={user.profilePic}
                title={user.fullName || "Unknown User"}
                subtitle={user.email || ""}
                right={
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-xs text-success">Friends</span>
                  </div>
                }
              />
            ))}
          </div>
        )}

        {tab === 'rejected' && (
          <div>
            {rejected.length === 0 ? (
              <div className="flex flex-col items-center text-base-content/70 py-10">
                <XCircle className="w-10 h-10 mb-2" />
                <div>No rejected requests</div>
              </div>
            ) : rejected.map(req => {
              const user = req.from?._id === requests?.me ? req.to : req.from;
              return (
                <Row key={req._id}
                  avatar={user?.profilePic}
                  title={user?.fullName}
                  subtitle="Rejected request"
                  right={
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-error" />
                      <span className="text-xs text-error">Rejected</span>
                    </div>
                  }
                />
              );
            })}
          </div>
        )}

        {tab === 'add' && (
          <div>
            <div className="text-sm text-base-content/70 font-medium mb-2">Your contacts</div>
            {contacts.length === 0 ? (
              <div className="flex flex-col items-center text-base-content/70 py-10">
                <Search className="w-10 h-10 mb-2" />
                <div>No contacts found</div>
              </div>
            ) : contacts.map(user => {
              // Check if user is already a friend
              const isFriend = friends.some(friend => friend._id === user._id);
              // Check if there's already an outgoing request
              const hasOutgoingRequest = outgoing.some(req => req.to._id === user._id);
              // Check if there's an incoming request
              const hasIncomingRequest = incoming.some(req => req.from._id === user._id);

              let rightContent;
              if (isFriend) {
                rightContent = (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-xs text-success">Friends</span>
                  </div>
                );
              } else if (hasOutgoingRequest) {
                rightContent = (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warning" />
                    <span className="text-xs text-warning">Pending</span>
                  </div>
                );
              } else if (hasIncomingRequest) {
                rightContent = (
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-info" />
                    <span className="text-xs text-info">Received</span>
                  </div>
                );
              } else {
                rightContent = (
                  <button className={`btn btn-xs btn-primary ${isLoading(user._id) ? 'btn-disabled' : ''}`} disabled={isLoading(user._id)} onClick={async () => { setLoading(user._id, 'Sending...'); await sendRequest(user._id); await fetchRequests(); clearLoading(user._id); }}>
                    {isLoading(user._id) ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span className="ml-1">Send</span>
                      </>
                    )}
                  </button>
                );
              }

              return (
                <Row key={user._id}
                  avatar={user.profilePic}
                  title={user.fullName || "Unknown User"}
                  subtitle={user.email || ""}
                  right={rightContent}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-3xl mx-auto">
      <div className="flex flex-col h-full">
        {modalContent}
      </div>
    </IOSModal>
  );
};

export default FriendsModal;
