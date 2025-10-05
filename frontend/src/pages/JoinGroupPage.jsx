import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { axiosInstance } from "../lib/axios";
import { useChatStore } from "../store/useChatStore";
import Avatar from "../components/Avatar";

export default function JoinGroupPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { getMyChatPartners, setSelectedGroup } = useChatStore();
  const [meta, setMeta] = useState({ loading: true, error: null, data: null });
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let mounted = true;
    axiosInstance.get(`/api/groups/invite/${token}`)
      .then(res => { if (mounted) setMeta({ loading: false, error: null, data: res.data }); })
      .catch(err => { if (mounted) setMeta({ loading: false, error: err.response?.data?.message || 'Invalid or expired invite', data: null }); });
    return () => { mounted = false; };
  }, [token]);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const res = await axiosInstance.post(`/api/groups/invite/${token}/join`);
      // Refresh chat partners and select this group
      try { await getMyChatPartners(); } catch { /* empty */ }
      setSelectedGroup(res.data);
      navigate("/");
    } catch (e) {
      setMeta(m => ({ ...m, error: e.response?.data?.message || 'Join failed' }));
    } finally {
      setIsJoining(false);
    }
  };

  if (meta.loading) return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <span className="text-base-content/60">Loading invite…</span>
      </div>
    </div>
  );

  if (meta.error) return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="card bg-base-100 shadow-xl border max-w-md">
        <div className="card-body">
          <div className="alert alert-error text-error-content mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{meta.error}</span>
          </div>
          <div className="card-actions justify-end">
            <button className="btn" onClick={() => navigate("/")}>Back</button>
          </div>
        </div>
      </div>
    </div>
  );

  const info = meta.data;
  const g = info?.group || {};

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="card bg-base-100 shadow-xl border w-full max-w-md">
        <div className="card-body">
          {/* Header */}
          <h2 className="card-title text-2xl mb-4">Group Invitation</h2>

          {/* Group Info */}
          <div className="flex items-center gap-4 p-4 bg-base-200/50 rounded-lg mb-4">
            <Avatar
              src={g.groupPic}
              name={g.name}
              alt={g.name}
              size="w-16 h-16"
              textSize="text-xl"
            />
            <div className="flex-1">
              <div className="text-lg font-semibold">{g.name || 'Group'}</div>
              <div className="text-sm text-base-content/60">{g.membersCount || 0} members</div>
            </div>
          </div>

          {/* Validity Warning */}
          {!info?.valid && (
            <div className="alert alert-warning mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <div className="font-bold">Invalid Invite</div>
                <div className="text-sm">{info?.reason || 'This invite link is no longer valid'}</div>
              </div>
            </div>
          )}

          {/* Invite Details */}
          {info?.valid && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-base-content/60">Expires:</span>
                <span className="font-medium">
                  {info.expiresAt ? new Date(info.expiresAt).toLocaleString() : 'Never'}
                </span>
              </div>
              {info.maxUses && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">Uses:</span>
                  <span className="font-medium">
                    {info.usesCount || 0} / {info.maxUses}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="card-actions justify-end gap-2">
            <button
              className="btn btn-ghost"
              onClick={() => navigate("/")}
              disabled={isJoining}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary gap-2"
              disabled={!info?.valid || isJoining}
              onClick={handleJoin}
            >
              {isJoining ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Joining...
                </>
              ) : (
                'Join Group'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
