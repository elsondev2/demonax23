import { XIcon, Settings, LogOut, Link2, Shield, Users, Info, UserPlus, Trash2, Crown, Camera, Check } from "lucide-react";
import IOSModal from "./IOSModal";
import React, { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import useGroupStore from "../store/useGroupStore";
import Avatar from "./Avatar";
import InviteViaLink from "./InviteViaLink";
import toast from "react-hot-toast";

function GroupDetailsModal({ group, isOpen, onClose }) {
  const { authUser, onlineUsers: authOnlineUsers } = useAuthStore();
  const { getAllContacts, allContacts, setSelectedGroup } = useChatStore();
  const { updateGroup, leaveGroup } = useGroupStore();

  const [activeTab, setActiveTab] = useState("info");
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [members, setMembers] = useState(group?.members || []);
  const [inviteSearch, setInviteSearch] = useState("");
  const [newGroupPic, setNewGroupPic] = useState(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(authOnlineUsers || []);

  // Enhanced admin check with multiple comparison methods
  const isAdmin = React.useMemo(() => {
    if (!group || !authUser) return false;

    const groupAdminId = group.admin?._id || group.admin;
    const userId = authUser._id;

    // Try multiple comparison methods
    const isAdminCheck =
      groupAdminId === userId ||
      String(groupAdminId) === String(userId) ||
      groupAdminId?.toString() === userId?.toString();

    // Debug logging
    console.log('🔍 Admin Check:', {
      groupAdmin: groupAdminId,
      authUserId: userId,
      isAdmin: isAdminCheck,
      groupAdminType: typeof groupAdminId,
      userIdType: typeof userId
    });

    return isAdminCheck;
  }, [group, authUser]);

  useEffect(() => {
    setOnlineUsers(authOnlineUsers || []);
  }, [authOnlineUsers]);

  useEffect(() => {
    if (isOpen) {
      getAllContacts();
      setName(group?.name || "");
      setDescription(group?.description || "");
      setMembers(group?.members || []);
      setNewGroupPic(null);
      setActiveTab("info");
    }
  }, [isOpen, getAllContacts, group]);

  if (!isOpen) return null;

  const getMemberObj = (m) => {
    if (!m) return null;
    if (typeof m === 'string') {
      return allContacts.find(c => c._id === m) || { _id: m, fullName: m, profilePic: '/avatar.png' };
    }
    if (!m.fullName) {
      const found = allContacts.find(c => c._id === (m._id || m.id));
      return found ? found : { ...m, fullName: m._id || 'Member' };
    }
    return m;
  };

  const normalizedMembers = members.map(getMemberObj).filter(Boolean);
  const totalMembers = normalizedMembers.length;
  const onlineCount = normalizedMembers.filter(m => onlineUsers.includes(m._id || m.id)).length;
  const isUserOnline = (userId) => onlineUsers && onlineUsers.includes(userId);

  const norm = (s = "") => (s || "").toLowerCase();
  const inviteCandidates = (allContacts || [])
    .filter(c => !normalizedMembers.find(m => (m._id || m.id) === c._id))
    .filter(c => norm(c.fullName).includes(norm(inviteSearch)) || norm(c.email).includes(norm(inviteSearch)));

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(group._id);
      setShowLeaveConfirm(false);
      onClose();
      toast.success("Left group successfully");
    } catch (error) {
      toast.error("Failed to leave group");
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      toast.error("Group name is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        members: normalizedMembers.map(m => m._id || m.id)
      };
      if (newGroupPic && newGroupPic.startsWith('data:image')) {
        payload.groupPic = newGroupPic;
      }
      await updateGroup(group._id, payload);
      toast.success("Group updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const updatedMembers = members.filter(m => (m._id || m) !== memberId);
      setMembers(updatedMembers);
      await updateGroup(group._id, { members: updatedMembers.map(m => m._id || m) });
      toast.success("Member removed");
    } catch (error) {
      toast.error("Failed to remove member");
      setMembers(group?.members || []);
    }
  };

  const handlePromoteToAdmin = async (memberId) => {
    try {
      await updateGroup(group._id, { admin: memberId });
      toast.success("Member promoted to admin");
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error("Failed to promote member");
    }
  };

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-3xl">
      <div className="flex flex-col h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-base-200 p-6 relative border-b border-base-300">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 btn btn-sm btn-circle btn-ghost hover:bg-base-300 z-10"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            {/* Group Avatar */}
            <div className="relative group">
              <div className="rounded-full ring-4 ring-primary/20 shadow-lg p-0.5">
                <Avatar
                  src={newGroupPic || group?.groupPic}
                  name={group?.name}
                  alt={group?.name || "Group"}
                  size="w-20 h-20"
                  textSize="text-2xl"
                />
              </div>
              {isAdmin && (
                <label className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = () => setNewGroupPic(reader.result?.toString());
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>

            {/* Group Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1 text-base-content">{group?.name}</h2>
              <div className="flex items-center gap-3 text-sm text-base-content/70">
                <span>{totalMembers} members</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                  <span>{onlineCount} online</span>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-base-content/60">Administrator:</span>
                {(() => {
                  const adminId = group?.admin?._id || group?.admin;
                  const admin = normalizedMembers.find(m => (m._id || m.id)?.toString() === adminId?.toString());
                  
                  if (!admin && adminId) {
                    // Fallback if admin not in normalized members yet
                    return <span className="text-sm font-medium text-base-content">Loading...</span>;
                  }
                  
                  if (!admin) {
                    return <span className="text-sm text-base-content/60">Unknown</span>;
                  }
                  
                  return (
                    <div className="flex items-center gap-1">
                      <Avatar
                        src={admin.profilePic}
                        name={admin.fullName}
                        alt={admin.fullName}
                        size="w-5 h-5"
                        textSize="text-xs"
                      />
                      <span className="text-sm font-medium text-base-content">{admin.fullName}</span>
                      {(admin._id || admin.id) === authUser._id && (
                        <span className="badge badge-warning badge-xs gap-1">
                          <Crown className="w-2 h-2" />
                          You
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 bg-base-100 border-b border-base-300">
          <div className="flex">
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'info'
                ? 'bg-base-100 text-primary border-b-2 border-primary'
                : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
                }`}
              onClick={() => setActiveTab('info')}
            >
              <Info className="w-4 h-4 inline mr-2" />
              Info
            </button>
            <button
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'members'
                ? 'bg-base-100 text-primary border-b-2 border-primary'
                : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
                }`}
              onClick={() => setActiveTab('members')}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Members
            </button>
            {isAdmin && (
              <>
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'invite'
                    ? 'bg-base-100 text-primary border-b-2 border-primary'
                    : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
                    }`}
                  onClick={() => setActiveTab('invite')}
                >
                  <UserPlus className="w-4 h-4 inline mr-2" />
                  Invite
                </button>
                <button
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${activeTab === 'settings'
                    ? 'bg-base-100 text-primary border-b-2 border-primary'
                    : 'text-base-content/60 hover:text-base-content hover:bg-base-200'
                    }`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="w-4 h-4 inline mr-2" />
                  Settings
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Description */}
              <div className="bg-base-200/50 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-base-content/70 mb-2">DESCRIPTION</h3>
                <p className="text-base-content">{group?.description || 'No description provided'}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-primary/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{totalMembers}</div>
                  <div className="text-xs text-base-content/60 mt-1">Members</div>
                </div>
                <div className="bg-success/10 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-success">{onlineCount}</div>
                  <div className="text-xs text-base-content/60 mt-1">Online</div>
                </div>
                <div className="bg-base-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-base-content/40">{totalMembers - onlineCount}</div>
                  <div className="text-xs text-base-content/60 mt-1">Offline</div>
                </div>
              </div>

              {/* Group Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-xs text-base-content/60 mb-1">CREATED</div>
                  <div className="font-medium">
                    {group?.createdAt ? new Date(group.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : "Unknown"}
                  </div>
                </div>
                <div className="bg-base-200/50 rounded-xl p-4">
                  <div className="text-xs text-base-content/60 mb-1">PRIVACY</div>
                  <div className="font-medium">
                    {group?.isPrivate ? '🔒 Private' : '🌐 Public'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-3 max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">All Members ({totalMembers})</h3>
                <div className="text-xs text-base-content/60">
                  🟢 {onlineCount} online • ⚫ {totalMembers - onlineCount} offline
                </div>
              </div>

              {normalizedMembers.map((member) => {
                const isOnline = isUserOnline(member._id || member.id);
                const isMemberAdmin = group.admin?.toString?.() === (member._id || member.id)?.toString();

                return (
                  <div key={member._id || member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200 transition-colors">
                    <Avatar
                      src={member.profilePic}
                      name={member.fullName}
                      alt={member.fullName}
                      size="w-12 h-12"
                      showOnlineStatus={true}
                      isOnline={isOnline}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{member.fullName}</span>
                        {(member._id || member.id) === authUser._id && (
                          <span className="badge badge-primary badge-xs">You</span>
                        )}
                      </div>
                      <div className="text-sm text-base-content/60">
                        {isOnline ? '🟢 Online' : '⚫ Offline'}
                      </div>
                    </div>

                    {isMemberAdmin && (
                      <div className="badge badge-warning gap-1">
                        <Crown className="w-3 h-3" />
                        Admin
                      </div>
                    )}

                    {isAdmin && !isMemberAdmin && (member._id || member.id) !== authUser._id && (
                      <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-sm btn-ghost">⋮</div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-lg w-48">
                          <li>
                            <button
                              className="text-warning"
                              onClick={() => handlePromoteToAdmin(member._id || member.id)}
                            >
                              <Crown className="w-4 h-4" />
                              Make Admin
                            </button>
                          </li>
                          <li>
                            <button
                              className="text-error"
                              onClick={() => handleRemoveMember(member._id || member.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Invite Tab */}
          {activeTab === 'invite' && isAdmin && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <InviteViaLink group={group} />

              <div className="divider">OR INVITE FROM CONTACTS</div>

              <div>
                <input
                  className="input input-bordered w-full mb-3"
                  placeholder="Search contacts..."
                  value={inviteSearch}
                  onChange={e => setInviteSearch(e.target.value)}
                />

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {inviteCandidates.map(c => (
                    <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200">
                      <Avatar
                        src={c.profilePic}
                        name={c.fullName}
                        alt={c.fullName}
                        size="w-10 h-10"
                      />
                      <span className="flex-1 truncate">{c.fullName}</span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => setMembers(prev => [...prev, c])}
                      >
                        <UserPlus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  ))}
                  {inviteCandidates.length === 0 && (
                    <div className="text-center text-base-content/60 py-12">
                      {inviteSearch ? 'No contacts match your search' : 'All contacts are already members'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && isAdmin && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Group Name</span>
                  <span className="label-text-alt text-error">Required</span>
                </label>
                <input
                  className="input input-bordered w-full"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter group name..."
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-semibold">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter group description..."
                />
              </div>

              <div className="bg-base-200/50 rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Private Group
                    </div>
                    <div className="text-sm text-base-content/60 mt-1">
                      {group?.isPrivate ? 'Only invited members can join' : 'Anyone with link can join'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={group?.isPrivate || false}
                    onChange={(e) => updateGroup(group._id, { isPrivate: e.target.checked })}
                  />
                </label>
              </div>

              <button
                className="btn btn-primary w-full gap-2"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 border-t border-base-300 bg-base-100">
          <div className="flex gap-3">
            <button
              className="btn btn-primary flex-1 gap-2"
              onClick={() => { setSelectedGroup(group); onClose(); }}
            >
              <Users className="w-4 h-4" />
              Open Chat
            </button>

            {!isAdmin && (
              <button
                className="btn btn-error flex-1 gap-2"
                onClick={() => setShowLeaveConfirm(true)}
              >
                <LogOut className="w-4 h-4" />
                Leave Group
              </button>
            )}
          </div>
        </div>

        {/* Leave Confirmation Modal */}
        {showLeaveConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-xl p-6 max-w-sm mx-4">
              <h3 className="font-bold text-lg mb-2">Leave Group?</h3>
              <p className="text-base-content/70 mb-4">
                Are you sure you want to leave "{group?.name}"? You'll need to be re-invited to rejoin.
              </p>
              <div className="flex gap-3">
                <button
                  className="btn btn-ghost flex-1"
                  onClick={() => setShowLeaveConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error flex-1"
                  onClick={handleLeaveGroup}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </IOSModal>
  );
}

export default GroupDetailsModal;
