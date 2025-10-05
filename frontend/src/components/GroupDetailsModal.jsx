import { XIcon, Settings, LogOut, Link, Shield, Users, Info, UserPlus, Trash2, Crown } from "lucide-react";
import IOSModal from "./IOSModal";
import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import useGroupStore from "../store/useGroupStore";
import Avatar from "./Avatar";
import InviteViaLink from "./InviteViaLink";
import toast from "react-hot-toast";

function GroupDetailsModal({ group, isOpen, onClose }) {
  const { authUser, onlineUsers: authOnlineUsers, socket } = useAuthStore();
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

  // Check if current user is admin
  const isAdmin = group && authUser && (
    group.admin?.toString?.() === authUser._id?.toString?.() ||
    group.admin?.toString?.() === authUser._id ||
    group.admin === authUser._id
  );

  // Debug logging
  useEffect(() => {
    if (isOpen && group && authUser) {
      console.log('🔍 GroupDetailsModal - Admin Check:', {
        groupAdmin: group.admin,
        authUserId: authUser._id,
        isAdmin,
        groupAdminType: typeof group.admin,
        authUserIdType: typeof authUser._id,
        comparison1: group.admin?.toString?.() === authUser._id?.toString?.(),
        comparison2: group.admin?.toString?.() === authUser._id,
        comparison3: group.admin === authUser._id
      });
    }
  }, [isOpen, group, authUser, isAdmin]);

  // Update online users when they change
  useEffect(() => {
    setOnlineUsers(authOnlineUsers || []);
  }, [authOnlineUsers]);

  // Request online users when modal opens
  useEffect(() => {
    if (isOpen && socket && socket.connected) {
      socket.emit("getOnlineUsers");
    }
  }, [isOpen, socket]);

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

  // Normalize member object
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

  // Format join date
  const getJoinDate = (memberId) => {
    if (!group?.memberJoinDates) return "—";
    const joinDatesMap = group.memberJoinDates instanceof Map
      ? group.memberJoinDates
      : new Map(Object.entries(group.memberJoinDates));
    const joinDate = joinDatesMap.get(memberId.toString());
    return joinDate ? new Date(joinDate).toLocaleDateString() : "—";
  };

  // Contacts available to invite
  const norm = (s = "") => (s || "").toLowerCase();
  const inviteCandidates = (allContacts || [])
    .filter(c => !normalizedMembers.find(m => (m._id || m.id) === c._id))
    .filter(c => norm(c.fullName).includes(norm(inviteSearch)) || norm(c.email).includes(norm(inviteSearch)));

  const totalMembers = normalizedMembers.length;
  const onlineCount = normalizedMembers.filter(m => onlineUsers.includes(m._id || m.id)).length;
  const isUserOnline = (userId) => {
    const isOnline = onlineUsers && onlineUsers.includes(userId);
    return isOnline;
  };

  const handleLeaveGroup = async () => {
    try {
      await leaveGroup(group._id);
      setShowLeaveConfirm(false);
      onClose();
      toast.success("Left group successfully");
    } catch (error) {
      console.error("Error leaving group:", error);
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
      console.error("Error updating group:", error);
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
      toast.success("Member removed successfully");
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
      // Revert on error
      setMembers(group?.members || []);
    }
  };

  const handlePromoteToAdmin = async (memberId) => {
    try {
      await updateGroup(group._id, { admin: memberId });
      toast.success("Member promoted to admin");
      // Refresh the page to show updated admin status
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error("Error promoting member:", error);
      toast.error("Failed to promote member");
    }
  };

  return (
    <IOSModal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          {/* Top bar with close button */}
          <div className="relative bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-4">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 btn btn-sm btn-ghost btn-circle hover:bg-base-100/20 z-10"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </button>
            <div className="absolute top-4 left-4">
              <div className={`badge ${group?.isPrivate ? 'badge-warning' : 'badge-success'} badge-sm`}>
                {group?.isPrivate ? 'Private' : 'Public'}
              </div>
            </div>
          </div>

          {/* Group Picture and Name */}
          <div className="flex flex-col items-center -mt-8 px-6 pb-4 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="mb-3 relative group">
              <Avatar
                src={newGroupPic || group?.groupPic}
                name={group?.name}
                alt={group?.name || "Group"}
                size="w-24 h-24"
                textSize="text-3xl"
                className="ring-4 ring-base-100 shadow-xl"
              />
              {isAdmin && (
                <label className="absolute inset-0 bg-black/60 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                  <div className="text-center">
                    <div className="text-sm font-medium">Change</div>
                  </div>
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
            <h2 className="text-xl font-bold text-base-content text-center">{group?.name}</h2>
            <div className="flex items-center gap-3 text-sm text-base-content/60">
              <span>{totalMembers} members</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                <span>{onlineCount} online</span>
              </div>
              {isAdmin && (
                <>
                  <span>•</span>
                  <div className="badge badge-warning badge-sm gap-1">
                    <Crown className="w-3 h-3" />
                    Admin
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed bg-base-200 mx-4 mb-2 gap-1 p-1">
            <button
              className={`tab gap-2 flex-1 ${activeTab === 'info' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Info</span>
            </button>
            <button
              className={`tab gap-2 flex-1 ${activeTab === 'members' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Members</span>
            </button>
            {isAdmin ? (
              <>
                <button
                  className={`tab gap-2 flex-1 ${activeTab === 'invite' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('invite')}
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Invite</span>
                </button>
                <button
                  className={`tab gap-2 flex-1 ${activeTab === 'settings' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-base-content/40 px-2">
                <Shield className="w-3 h-3 mr-1" />
                Admin only tabs hidden
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              {/* Description Card */}
              <div className="card bg-base-200/50 border border-base-300/50">
                <div className="card-body p-4 space-y-3">
                  <div>
                    <div className="text-xs font-medium text-base-content/70 uppercase tracking-wide mb-1">Description</div>
                    <p className="text-sm text-base-content">{group?.description || 'No description'}</p>
                  </div>
                  <div className="divider my-2"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-medium text-base-content/70 uppercase tracking-wide mb-1">Created</div>
                      <div className="text-sm text-base-content">
                        {group?.createdAt ? new Date(group.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : "Unknown"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-base-content/70 uppercase tracking-wide mb-1">Privacy</div>
                      <div className="text-sm text-base-content">{group?.isPrivate ? 'Private' : 'Public'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                <div className="card-body p-4">
                  <div className="text-sm font-semibold text-base-content mb-3">Group Statistics</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-base-100/50 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{totalMembers}</div>
                      <div className="text-xs text-base-content/60">Members</div>
                    </div>
                    <div className="text-center p-2 bg-base-100/50 rounded-lg">
                      <div className="text-2xl font-bold text-success flex items-center justify-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                        {onlineCount}
                      </div>
                      <div className="text-xs text-base-content/60">Online</div>
                    </div>
                    <div className="text-center p-2 bg-base-100/50 rounded-lg">
                      <div className="text-2xl font-bold text-base-content/40">{totalMembers - onlineCount}</div>
                      <div className="text-xs text-base-content/60">Offline</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Administrator Card */}
              <div className="card bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/30">
                <div className="card-body p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-warning" />
                    <div className="text-sm font-semibold text-base-content">Administrator</div>
                  </div>
                  {normalizedMembers.filter(m => group.admin?.toString?.() === (m._id || m.id)?.toString()).map(admin => {
                    const adminIsOnline = isUserOnline(admin._id || admin.id);
                    return (
                      <div key={admin._id || admin.id} className="flex items-center gap-3 p-2 bg-base-100/50 rounded-lg">
                        <Avatar
                          src={admin.profilePic}
                          name={admin.fullName}
                          alt={admin.fullName}
                          size="w-10 h-10"
                          textSize="text-sm"
                          showOnlineStatus={true}
                          isOnline={adminIsOnline}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{admin.fullName}</div>
                          <div className="flex items-center gap-1 text-xs">
                            <div className={`w-1.5 h-1.5 rounded-full ${adminIsOnline ? 'bg-success animate-pulse' : 'bg-base-300'}`}></div>
                            <span className={adminIsOnline ? 'text-success' : 'text-base-content/40'}>
                              {adminIsOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                        {(admin._id || admin.id) === authUser._id && (
                          <div className="badge badge-primary badge-sm">You</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-base-content">All Members ({totalMembers})</h4>
                <div className="flex items-center gap-3 text-xs text-base-content/60">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
                    <span>{onlineCount} online</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-base-300"></div>
                    <span>{totalMembers - onlineCount} offline</span>
                  </div>
                </div>
              </div>
              {normalizedMembers.map((member) => {
                const isOnline = isUserOnline(member._id || member.id);
                const isMemberAdmin = group.admin?.toString?.() === (member._id || member.id)?.toString();
                return (
                  <div key={member._id || member.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-base-200 border border-base-300/30">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar
                        src={member.profilePic}
                        name={member.fullName}
                        alt={member.fullName}
                        size="w-10 h-10"
                        showOnlineStatus={true}
                        isOnline={isOnline}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base-content truncate font-medium">{member.fullName}</span>
                          {(member._id || member.id) === authUser._id && (
                            <span className="badge badge-primary badge-xs">You</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-base-content/60">
                          <span className={isOnline ? 'text-success' : 'text-base-content/40'}>
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                          <span>•</span>
                          <span>Joined {getJoinDate(member._id || member.id)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMemberAdmin && (
                        <div className="badge badge-warning gap-1">
                          <Shield className="w-3 h-3" />
                          Admin
                        </div>
                      )}
                      {isAdmin && !isMemberAdmin && (member._id || member.id) !== authUser._id && (
                        <div className="dropdown dropdown-end">
                          <div tabIndex={0} role="button" className="btn btn-xs btn-ghost">⋮</div>
                          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                              <button
                                className="text-warning flex items-center gap-2"
                                onClick={() => handlePromoteToAdmin(member._id || member.id)}
                              >
                                <Crown className="w-3 h-3" />
                                Promote to Admin
                              </button>
                            </li>
                            <li>
                              <button
                                className="text-error flex items-center gap-2"
                                onClick={() => handleRemoveMember(member._id || member.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove from Group
                              </button>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Invite Tab */}
          {activeTab === 'invite' && isAdmin && (
            <div className="space-y-4">
              <InviteViaLink group={group} />

              <div className="divider">OR</div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-base-content">Invite from contacts</label>
                </div>
                <div className="relative mb-3">
                  <input
                    className="input input-bordered w-full"
                    placeholder="Search contacts..."
                    value={inviteSearch}
                    onChange={e => setInviteSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {inviteCandidates.map(c => (
                    <div key={c._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-base-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={c.profilePic}
                          name={c.fullName}
                          alt={c.fullName}
                          size="w-8 h-8"
                        />
                        <span className="truncate">{c.fullName}</span>
                      </div>
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => setMembers(prev => [...prev, c])}
                      >
                        Add
                      </button>
                    </div>
                  ))}
                  {inviteCandidates.length === 0 && (
                    <div className="text-center text-sm text-base-content/60 py-8">
                      {inviteSearch ? 'No contacts match your search' : 'All contacts are already members'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && isAdmin && (
            <div className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base-content flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Basic Information
                </h3>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Group Name</span>
                    <span className="label-text-alt text-error">*Required</span>
                  </label>
                  <input
                    className="input input-bordered w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter group name..."
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full"
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter group description..."
                  />
                </div>
              </div>

              <div className="divider"></div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base-content flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy & Security
                </h3>

                <div className="form-control">
                  <label className="label cursor-pointer">
                    <div>
                      <span className="label-text font-medium">Private Group</span>
                      <p className="text-xs text-base-content/60 mt-1">
                        {group?.isPrivate ? 'Only invited members can join' : 'Anyone with invite link can join'}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle toggle-primary"
                      checked={group?.isPrivate || false}
                      onChange={(e) => {
                        updateGroup(group._id, { isPrivate: e.target.checked });
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="divider"></div>

              {/* Member Management */}
              <div className="space-y-4">
                <h3 className="font-semibold text-base-content flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Member Management
                </h3>

                <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
                  <div className="stat">
                    <div className="stat-title">Total Members</div>
                    <div className="stat-value text-primary">{totalMembers}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Online Now</div>
                    <div className="stat-value text-success">{onlineCount}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Offline</div>
                    <div className="stat-value text-base-content/40">{totalMembers - onlineCount}</div>
                  </div>
                </div>

                <div className="alert alert-info">
                  <Info className="w-5 h-5" />
                  <div className="text-sm">
                    <p className="font-medium">Quick Actions:</p>
                    <ul className="list-disc list-inside mt-1 text-xs">
                      <li>Go to Members tab to manage individual members</li>
                      <li>Go to Invite tab to add new members</li>
                      <li>Promote members to admin from Members tab</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="divider"></div>

              {/* Save Button */}
              <button
                className="btn btn-primary w-full gap-2"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4" />
                    Save All Changes
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 p-4 border-t border-base-300 bg-base-100 space-y-2">
          {/* Debug Info - Click to expand */}
          <div className="collapse collapse-arrow bg-base-200 mb-2">
            <input type="checkbox" />
            <div className="collapse-title text-xs font-medium">
              🔧 Debug Info {isAdmin && <span className="badge badge-success badge-xs ml-2">Admin</span>}
            </div>
            <div className="collapse-content text-xs space-y-1">
              <div>Admin Status: <span className={isAdmin ? 'text-success font-bold' : 'text-error'}>{isAdmin ? '✓ Yes (Tabs should show)' : '✗ No (Tabs hidden)'}</span></div>
              <div>Group Admin ID: <code className="bg-base-300 px-1 rounded">{group?.admin?.toString?.() || 'N/A'}</code></div>
              <div>Your User ID: <code className="bg-base-300 px-1 rounded">{authUser?._id?.toString?.() || 'N/A'}</code></div>
              <div>IDs Match: {group?.admin?.toString?.() === authUser?._id?.toString?.() ? '✓ Yes' : '✗ No'}</div>
              <div className="mt-2 pt-2 border-t border-base-300">
                <div className="font-semibold mb-1">Visible Tabs:</div>
                <div>• Info ✓</div>
                <div>• Members ✓</div>
                {isAdmin && <div className="text-success">• Invite ✓ (Admin)</div>}
                {isAdmin && <div className="text-success">• Settings ✓ (Admin)</div>}
                {!isAdmin && <div className="text-base-content/40">• Invite ✗ (Admin only)</div>}
                {!isAdmin && <div className="text-base-content/40">• Settings ✗ (Admin only)</div>}
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-block gap-2"
            onClick={() => { setSelectedGroup(group); onClose(); }}
          >
            <Users className="w-4 h-4" />
            Open Chat
          </button>

          {(!isAdmin || normalizedMembers.filter(m => group.admin?.toString?.() === (m._id || m.id)?.toString()).length > 1) && (
            <button
              className="btn btn-outline btn-error btn-block gap-2"
              onClick={() => setShowLeaveConfirm(true)}
            >
              <LogOut className="w-4 h-4" />
              Leave Group
            </button>
          )}
        </div>

        {/* Leave Confirmation Modal */}
        {showLeaveConfirm && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Leave Group?</h3>
              <p className="text-base-content/70 mb-6">
                Are you sure you want to leave "{group?.name}"? You won't be able to see new messages unless someone adds you back.
              </p>
              <div className="modal-action">
                <button className="btn btn-ghost" onClick={() => setShowLeaveConfirm(false)}>
                  Cancel
                </button>
                <button className="btn btn-error" onClick={handleLeaveGroup}>
                  Leave Group
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowLeaveConfirm(false)}></div>
          </div>
        )}
      </div>
    </IOSModal>
  );
}

export default GroupDetailsModal;
