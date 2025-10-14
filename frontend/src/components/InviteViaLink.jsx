import { useState, useEffect, useCallback } from "react";
import { Link2, Copy, Check, RefreshCw, Clock, Users as UsersIcon, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

function InviteViaLink({ group }) {
  const [inviteLink, setInviteLink] = useState(null);
  const [inviteData, setInviteData] = useState(null);
  const [activeLinks, setActiveLinks] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [expiresInMinutes, setExpiresInMinutes] = useState("");
  const [maxUses, setMaxUses] = useState("");

  // Fetch active invite links - wrapped in useCallback
  const fetchActiveLinks = useCallback(async () => {
    if (!group?._id) return;

    setIsLoadingLinks(true);
    try {
      const res = await axiosInstance.get(`/api/groups/${group._id}/invite-links`);
      setActiveLinks(res.data || []);
    } catch (error) {
      console.error('Failed to fetch invite links:', error);
    } finally {
      setIsLoadingLinks(false);
    }
  }, [group?._id]);

  useEffect(() => {
    fetchActiveLinks();
  }, [fetchActiveLinks]);

  const generateInviteLink = async () => {
    setIsGenerating(true);
    try {
      console.log('🔗 Generating invite link for group:', group._id);

      const payload = {};
      if (expiresInMinutes && !isNaN(expiresInMinutes)) {
        payload.expiresInMinutes = parseInt(expiresInMinutes);
      }
      if (maxUses && !isNaN(maxUses)) {
        payload.maxUses = parseInt(maxUses);
      }

      const res = await axiosInstance.post(`/api/groups/${group._id}/invite-links`, payload);
      console.log('✅ Invite link response:', res.data);

      const token = res.data.token;
      const link = `${window.location.origin}/join/${token}`;
      setInviteLink(link);
      setInviteData(res.data);
      toast.success("Invite link generated!");

      // Refresh active links
      fetchActiveLinks();
    } catch (error) {
      console.error('❌ Failed to generate invite link:', error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to generate invite link";
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLinkStatus = async (linkId, currentStatus) => {
    try {
      await axiosInstance.patch(`/api/groups/${group._id}/invite-links/${linkId}`, {
        isActive: !currentStatus
      });
      toast.success(currentStatus ? "Link disabled" : "Link enabled");
      fetchActiveLinks();
    } catch (error) {
      toast.error("Failed to update link status");
    }
  };

  const deleteLink = async (linkId) => {
    if (!confirm("Are you sure you want to delete this invite link?")) return;

    try {
      await axiosInstance.delete(`/api/groups/${group._id}/invite-links/${linkId}`);
      toast.success("Link deleted");
      fetchActiveLinks();
    } catch (error) {
      toast.error("Failed to delete link");
    }
  };

  const copyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card bg-base-200/50 border border-base-300/50">
      <div className="card-body p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            <h4 className="font-semibold text-base-content">Invite via Link</h4>
          </div>
          {!inviteLink && (
            <button
              className="btn btn-ghost btn-xs"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Simple' : 'Advanced'}
            </button>
          )}
        </div>

        <p className="text-sm text-base-content/70">
          Generate a shareable link to invite people to this group
        </p>

        {!inviteLink ? (
          <div className="space-y-3">
            {showAdvanced && (
              <div className="space-y-2 p-3 bg-base-300/30 rounded-lg">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Expires in (minutes)
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    placeholder="Leave empty for no expiration"
                    value={expiresInMinutes}
                    onChange={(e) => setExpiresInMinutes(e.target.value)}
                    min="1"
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs flex items-center gap-1">
                      <UsersIcon className="w-3 h-3" />
                      Max uses
                    </span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered input-sm"
                    placeholder="Leave empty for unlimited"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            )}

            <button
              className="btn btn-primary btn-sm gap-2 w-full"
              onClick={generateInviteLink}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  Generate Invite Link
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Link Display */}
            <div className="flex gap-2">
              <input
                type="text"
                className="input input-bordered input-sm flex-1 text-xs font-mono"
                value={inviteLink}
                readOnly
                onClick={(e) => e.target.select()}
              />
              <button
                className="btn btn-sm btn-square"
                onClick={copyToClipboard}
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Link Info */}
            {inviteData && (
              <div className="text-xs text-base-content/60 space-y-1 p-2 bg-base-300/20 rounded">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>
                    {inviteData.expiresAt
                      ? `Expires: ${new Date(inviteData.expiresAt).toLocaleString()}`
                      : 'Never expires'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <UsersIcon className="w-3 h-3" />
                  <span>
                    {inviteData.maxUses
                      ? `Max uses: ${inviteData.maxUses} (${inviteData.usesCount} used)`
                      : 'Unlimited uses'}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-xs gap-1 flex-1"
                onClick={() => {
                  setInviteLink(null);
                  setInviteData(null);
                  setExpiresInMinutes("");
                  setMaxUses("");
                }}
              >
                <RefreshCw className="w-3 h-3" />
                Generate New Link
              </button>
            </div>
          </div>
        )}

        {/* Active Links Section */}
        {activeLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-base-300">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold text-base-content">Active Invite Links</h5>
              <span className="badge badge-sm">{activeLinks.length}</span>
            </div>

            {isLoadingLinks ? (
              <div className="text-center py-4">
                <span className="loading loading-spinner loading-sm"></span>
              </div>
            ) : (
              <div className="space-y-2">
                {activeLinks.map((link) => {
                  const fullLink = `${window.location.origin}/join/${link.token}`;
                  const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                  const isMaxedOut = link.maxUses && link.usesCount >= link.maxUses;

                  return (
                    <div
                      key={link._id}
                      className={`p-3 rounded-lg border ${!link.isActive || isExpired || isMaxedOut
                        ? 'bg-base-300/20 border-base-300/50 opacity-60'
                        : 'bg-base-200/50 border-base-300'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono truncate block">{link.token.substring(0, 12)}...</code>
                            {!link.isActive && <span className="badge badge-error badge-xs">Disabled</span>}
                            {isExpired && <span className="badge badge-warning badge-xs">Expired</span>}
                            {isMaxedOut && <span className="badge badge-warning badge-xs">Max Uses</span>}
                          </div>
                          <div className="text-xs text-base-content/60 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {link.expiresAt
                                ? `Expires: ${new Date(link.expiresAt).toLocaleDateString()}`
                                : 'Never expires'}
                            </div>
                            <div className="flex items-center gap-1">
                              <UsersIcon className="w-3 h-3" />
                              {link.maxUses
                                ? `${link.usesCount}/${link.maxUses} uses`
                                : `${link.usesCount} uses`}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(fullLink);
                              toast.success("Link copied!");
                            }}
                            title="Copy link"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => toggleLinkStatus(link._id, link.isActive)}
                            title={link.isActive ? "Disable link" : "Enable link"}
                          >
                            {link.isActive ? (
                              <ToggleRight className="w-3 h-3 text-success" />
                            ) : (
                              <ToggleLeft className="w-3 h-3 text-base-content/40" />
                            )}
                          </button>
                          <button
                            className="btn btn-xs btn-ghost text-error"
                            onClick={() => deleteLink(link._id)}
                            title="Delete link"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteViaLink;
