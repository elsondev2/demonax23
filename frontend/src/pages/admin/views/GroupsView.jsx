import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, X, Layers, MessageSquare, Camera, FileText, Crown } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import toast from "react-hot-toast";
import Avatar from "../../../components/Avatar";
import { exportCSV } from "../utils";

export default function GroupsView({ groups, setEditModal, setDeleteModal, groupsSubTab, setGroupsSubTab, groupConversations, selectedGroup, groupThreadMessages, onSelectGroupConversation, q, setQ, setPage, convPage, setConvPage, convPerPage, setConvPerPage, loading, groupThreadQ, setGroupThreadQ }) {
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle individual message selection
  const toggleMessageSelection = (msgId) => {
    setSelectedMessages(prev =>
      prev.includes(msgId)
        ? prev.filter(id => id !== msgId)
        : [...prev, msgId]
    );
  };

  // Select all messages
  const selectAllMessages = () => {
    if (groupThreadMessages.length > 0) {
      setSelectedMessages(groupThreadMessages.map(m => m._id));
    }
  };

  // Deselect all messages
  const deselectAllMessages = () => {
    setSelectedMessages([]);
  };

  // Bulk delete selected messages
  const handleBulkDelete = async () => {
    if (selectedMessages.length === 0) return;

    const confirmed = window.confirm(`Are you sure you want to delete ${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''}? This action cannot be undone.`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        selectedMessages.map(id => axiosInstance.delete(`/api/admin/messages/${id}`))
      );
      toast.success(`Successfully deleted ${selectedMessages.length} message${selectedMessages.length > 1 ? 's' : ''}`);
      setSelectedMessages([]);
      // Reload the group conversation
      if (selectedGroup) {
        onSelectGroupConversation(selectedGroup);
      }
      window.location.reload();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some messages');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear selection when switching tabs or groups
  useEffect(() => {
    setSelectedMessages([]);
  }, [groupsSubTab, selectedGroup]);

  const allSelected = groupThreadMessages.length > 0 && selectedMessages.length === groupThreadMessages.length;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Groups Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage groups and group conversations</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Groups</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{groups.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Conversations</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{groupConversations.length}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedMessages.length > 0 && (
                  <>
                    <div className="badge badge-primary gap-2">
                      <span className="text-xs">{selectedMessages.length} selected</span>
                    </div>
                    <button
                      className="btn btn-sm btn-error gap-2"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span className="text-xs">Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span className="text-xs">Delete Selected</span>
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-sm btn-ghost gap-2"
                      onClick={deselectAllMessages}
                    >
                      <X className="w-4 h-4" />
                      <span className="text-xs">Clear</span>
                    </button>
                  </>
                )}
                {groupsSubTab === 'all' && (
                  <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('groups.csv', groups, [
                    { label: 'Name', value: r => r.name },
                    { label: 'Admin', value: r => r.admin?.fullName || '' },
                    { label: 'Members', value: r => (r.members?.length || 0) },
                    { label: 'Created', value: r => new Date(r.createdAt).toISOString() }
                  ])}>
                    <span className="text-xs md:text-sm">Export CSV</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 pt-4 border-t border-base-300">
            <div className="tabs tabs-boxed">
              <button
                className={`tab tab-sm md:tab-md ${groupsSubTab === 'all' ? 'tab-active' : ''}`}
                onClick={() => setGroupsSubTab('all')}
              >
                <span className="text-xs md:text-sm">All Groups</span>
              </button>
              <button
                className={`tab tab-sm md:tab-md ${groupsSubTab === 'conversations' ? 'tab-active' : ''}`}
                onClick={() => setGroupsSubTab('conversations')}
              >
                <span className="text-xs md:text-sm">Conversations</span>
              </button>
            </div>

            {groupsSubTab === 'all' && (
              <div className="form-control">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                  <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    className="input input-sm input-bordered pl-9 pr-4 w-full"
                    placeholder="Search groups..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {groupsSubTab === 'all' ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-2 md:p-4">
            {loading && (
              <div className="text-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
                <div className="text-base font-medium mt-4">Loading groups...</div>
              </div>
            )}

            {!loading && (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="table table-zebra w-full text-sm">
                    <thead>
                      <tr>
                        <th className="w-20">Avatar</th>
                        <th>Group Name</th>
                        <th>Admin</th>
                        <th>Members</th>
                        <th>Created</th>
                        <th className="w-32">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group) => (
                        <tr key={group._id} className="hover">
                          <td>
                            <Avatar
                              src={group.groupPic}
                              name={group.name}
                              alt={group.name}
                              size="w-10 h-10"
                            />
                          </td>
                          <td>
                            <div className="font-medium">{group.name}</div>
                            {group.description && (
                              <div className="text-xs text-base-content/60 truncate max-w-xs">{group.description}</div>
                            )}
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="avatar">
                                <div className="w-6 h-6 rounded-full">
                                  <img src={group.admin?.profilePic || '/avatar.png'} alt="" />
                                </div>
                              </div>
                              <span className="font-medium">{group.admin?.fullName || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="badge badge-neutral badge-sm">
                              {group.members?.length || 0} members
                            </div>
                          </td>
                          <td className="text-xs text-base-content/70">
                            <div>{new Date(group.createdAt).toLocaleDateString()}</div>
                            <div>{new Date(group.createdAt).toLocaleTimeString()}</div>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                className="btn btn-xs btn-warning"
                                onClick={() => setEditModal({
                                  type: 'change-admin',
                                  id: group._id,
                                  data: {
                                    name: group.name,
                                    currentAdmin: group.admin,
                                    members: group.members
                                  }
                                })}
                                title="Change Admin"
                              >
                                <Crown className="w-3 h-3" />
                              </button>
                              <button
                                className="btn btn-xs btn-ghost"
                                onClick={() => setEditModal({
                                  type: 'groups',
                                  id: group._id,
                                  data: { name: group.name, description: group.description || '' }
                                })}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                className="btn btn-xs btn-error btn-outline"
                                onClick={() => setDeleteModal({ type: 'groups', id: group._id, name: group.name })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-2">
                  {groups.map((group) => (
                    <div key={group._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-3">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar
                            src={group.groupPic}
                            name={group.name}
                            alt={group.name}
                            size="w-8 h-8"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{group.name}</div>
                            {group.description && (
                              <div className="text-xs text-base-content/60 truncate">{group.description}</div>
                            )}
                          </div>
                          <div className="badge badge-neutral badge-sm">
                            {group.members?.length || 0}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div className="avatar">
                            <div className="w-5 h-5 rounded-full">
                              <img src={group.admin?.profilePic || '/avatar.png'} alt="" />
                            </div>
                          </div>
                          <span className="text-xs text-base-content/60">Admin: {group.admin?.fullName || 'Unknown'}</span>
                          <span className="text-xs text-base-content/60">• {new Date(group.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-1 justify-end">
                          <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => setEditModal({
                              type: 'groups',
                              id: group._id,
                              data: { name: group.name, description: group.description || '' }
                            })}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="text-xs">Edit</span>
                          </button>
                          <button
                            className="btn btn-xs btn-error btn-outline"
                            onClick={() => setDeleteModal({ type: 'groups', id: group._id, name: group.name })}
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="text-xs">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-2 md:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[70vh]">
              {/* Group Conversations list */}
              <div className="lg:col-span-1 border-b lg:border-b-0 lg:border-r border-base-300 pr-0 lg:pr-4 pb-4 lg:pb-0 flex flex-col max-h-[70vh] overflow-y-auto">
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 mb-4">
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text text-xs">Per page</span>
                    </label>
                    <select className="select select-sm select-bordered" value={convPerPage} onChange={(e) => { setConvPage(1); setConvPerPage(Number(e.target.value)); }}>
                      <option value={50}>50</option>
                      <option value={75}>75</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div className="join">
                    <button className="join-item btn btn-sm" disabled={convPage <= 1} onClick={() => setConvPage(p => Math.max(1, p - 1))}>Prev</button>
                    <button className="join-item btn btn-sm" onClick={() => setConvPage(p => p + 1)} disabled={groupConversations.length < convPerPage}>Next</button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : groupConversations.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No group conversations found</p>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {groupConversations.map((conv) => {
                      const isActive = selectedGroup === conv.group._id;

                      return (
                        <button
                          key={conv.group._id}
                          className={`w-full p-3 rounded-lg transition-all hover:bg-base-200 text-left ${isActive ? 'bg-primary/10 border-2 border-primary' : 'bg-base-100 border-2 border-transparent'
                            }`}
                          onClick={() => onSelectGroupConversation(conv.group._id)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar
                              src={conv.group.groupPic}
                              name={conv.group.name}
                              alt={conv.group.name}
                              size="w-10 h-10"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="text-sm font-semibold truncate">{conv.group.name}</div>
                                <span className="badge badge-primary badge-sm flex-shrink-0">{conv.count || 0}</span>
                              </div>

                              {conv.lastMessage && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="text-xs text-base-content/70 truncate flex-1">
                                    <span className="font-medium">{conv.sender?.fullName || 'User'}:</span>{' '}
                                    {conv.lastMessage.text || '[media]'}
                                  </div>
                                  <div className="text-xs text-base-content/50 flex-shrink-0">
                                    {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Group thread messages */}
              <div className="lg:col-span-2 flex flex-col">
                {selectedGroup ? (
                  <>
                    {/* Search bar */}
                    <div className="mb-4">
                      <div className="form-control">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                          <input
                            value={groupThreadQ}
                            onChange={(e) => {
                              setGroupThreadQ(e.target.value);
                              if (selectedGroup) onSelectGroupConversation(selectedGroup);
                            }}
                            className="input input-sm input-bordered pl-9 pr-4 w-full"
                            placeholder="Search in group..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Messages count */}
                    {groupThreadMessages.length > 0 && (
                      <div className="mb-3 text-xs text-base-content/60 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{groupThreadMessages.length} message{groupThreadMessages.length !== 1 ? 's' : ''} in this group</span>
                      </div>
                    )}

                    {/* Desktop Table View */}
                    <div className="hidden md:block flex-1 overflow-y-auto max-h-[70vh]">
                      {groupThreadMessages.length === 0 ? (
                        <div className="text-center py-12 text-base-content/60">
                          <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No messages found</p>
                        </div>
                      ) : (
                        <table className="table table-zebra w-full text-sm">
                          <thead className="sticky top-0 bg-base-100 z-10">
                            <tr>
                              <th className="w-12">
                                <label>
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={allSelected}
                                    onChange={(e) => e.target.checked ? selectAllMessages() : deselectAllMessages()}
                                  />
                                </label>
                              </th>
                              <th className="w-16">Avatar</th>
                              <th className="w-32">Member</th>
                              <th>Message</th>
                              <th className="w-40">Time</th>
                              <th className="w-24">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groupThreadMessages.map((msg) => (
                              <tr key={msg._id} className="hover">
                                <td>
                                  <label>
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-sm"
                                      checked={selectedMessages.includes(msg._id)}
                                      onChange={() => toggleMessageSelection(msg._id)}
                                    />
                                  </label>
                                </td>
                                <td>
                                  <div className="avatar">
                                    <div className="w-8 h-8 rounded-full">
                                      <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                                    </div>
                                  </div>
                                </td>
                                <td className={`font-medium ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                                  {msg.senderId?.fullName || 'Deleted User'}
                                </td>
                                <td className="max-w-md">
                                  <div className="flex flex-col gap-1">
                                    {msg.text && (
                                      <div className="text-sm">{msg.text}</div>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                      {msg.image && (
                                        <span className="badge badge-primary badge-sm gap-1">
                                          <Camera className="w-3 h-3" />
                                          Image
                                        </span>
                                      )}
                                      {msg.attachments?.length > 0 && (
                                        <span className="badge badge-secondary badge-sm gap-1">
                                          <FileText className="w-3 h-3" />
                                          {msg.attachments.length} File{msg.attachments.length > 1 ? 's' : ''}
                                        </span>
                                      )}
                                      {msg.audio && (
                                        <span className="badge badge-accent badge-sm">Voice Message</span>
                                      )}
                                    </div>
                                    {!msg.text && !msg.image && !msg.attachments?.length && !msg.audio && (
                                      <span className="text-xs text-base-content/40 italic">[No content]</span>
                                    )}
                                  </div>
                                </td>
                                <td className="text-xs text-base-content/70">
                                  <div className="font-medium">{new Date(msg.createdAt).toLocaleDateString()}</div>
                                  <div className="text-base-content/50">{new Date(msg.createdAt).toLocaleTimeString()}</div>
                                </td>
                                <td>
                                  <div className="flex gap-1">
                                    {msg.text && (
                                      <button
                                        className="btn btn-xs btn-ghost tooltip"
                                        data-tip="Edit"
                                        onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-xs btn-error btn-ghost tooltip"
                                      data-tip="Delete"
                                      onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex-1 overflow-y-auto max-h-[70vh] space-y-2">
                      {groupThreadMessages.length === 0 ? (
                        <div className="text-center py-12 text-base-content/60">
                          <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No messages found</p>
                        </div>
                      ) : (
                        groupThreadMessages.map((msg) => (
                          <div key={msg._id} className={`card shadow-sm ${selectedMessages.includes(msg._id) ? 'bg-primary/10 border-2 border-primary' : 'bg-base-200'}`}>
                            <div className="card-body p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <label>
                                  <input
                                    type="checkbox"
                                    className="checkbox checkbox-sm"
                                    checked={selectedMessages.includes(msg._id)}
                                    onChange={() => toggleMessageSelection(msg._id)}
                                  />
                                </label>
                                <div className="avatar">
                                  <div className="w-8 h-8 rounded-full">
                                    <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm font-medium ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                                    {msg.senderId?.fullName || 'Deleted User'}
                                  </div>
                                  <div className="text-xs text-base-content/60">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {msg.text && (
                                <div className="text-sm mb-2">{msg.text}</div>
                              )}

                              <div className="flex flex-wrap gap-1 mb-2">
                                {msg.image && (
                                  <span className="badge badge-primary badge-sm gap-1">
                                    <Camera className="w-3 h-3" />
                                    Image
                                  </span>
                                )}
                                {msg.attachments?.length > 0 && (
                                  <span className="badge badge-secondary badge-sm gap-1">
                                    <FileText className="w-3 h-3" />
                                    {msg.attachments.length} File{msg.attachments.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {msg.audio && (
                                  <span className="badge badge-accent badge-sm">Voice</span>
                                )}
                              </div>

                              <div className="flex gap-1 justify-end">
                                {msg.text && (
                                  <button
                                    className="btn btn-xs btn-ghost"
                                    onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span className="text-xs">Edit</span>
                                  </button>
                                )}
                                <button
                                  className="btn btn-xs btn-error btn-outline"
                                  onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span className="text-xs">Delete</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-base-content/60">
                    <div className="text-center">
                      <Layers className="w-20 h-20 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">Select a group</p>
                      <p className="text-sm">Choose a group from the list to view messages</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
