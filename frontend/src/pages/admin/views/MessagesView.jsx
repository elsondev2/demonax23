import { useState, useEffect } from "react";
import { Search, Edit2, Trash2, X, MessageSquare, Camera, FileText } from "lucide-react";
import { axiosInstance } from "../../../lib/axios";
import toast from "react-hot-toast";
import { exportCSV } from "../utils";

export default function MessagesView({ messagesSubTab, setMessagesSubTab, messages, conversations, selectedConversation, threadMessages, onSelectConversation, setEditModal, setDeleteModal, q, setQ, page, setPage, perPage, setPerPage, convPage, setConvPage, convPerPage, setConvPerPage, dmThreadQ, setDmThreadQ, loading }) {
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
    if (messagesSubTab === 'conversations' && threadMessages.length > 0) {
      setSelectedMessages(threadMessages.map(m => m._id));
    } else if (messagesSubTab === 'all' && messages.length > 0) {
      setSelectedMessages(messages.map(m => m._id));
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
      // Reload the conversation or messages
      if (selectedConversation) {
        onSelectConversation(selectedConversation.a, selectedConversation.b);
      }
      window.location.reload(); // Simple reload to refresh data
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast.error('Failed to delete some messages');
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear selection when switching tabs or conversations
  useEffect(() => {
    setSelectedMessages([]);
  }, [messagesSubTab, selectedConversation]);

  const currentMessages = messagesSubTab === 'conversations' ? threadMessages : messages;
  const allSelected = currentMessages.length > 0 && selectedMessages.length === currentMessages.length;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold">Messages Management</h2>
              <p className="text-sm text-base-content/60 hidden sm:block">Manage direct messages and conversations</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="stats shadow stats-vertical sm:stats-horizontal">
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Total Messages</div>
                  <div className="stat-value text-sm md:text-lg text-primary">{messages.length}</div>
                </div>
                <div className="stat py-2 px-3">
                  <div className="stat-title text-xs">Conversations</div>
                  <div className="stat-value text-sm md:text-lg text-secondary">{conversations.length}</div>
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
                {messagesSubTab === 'all' && (
                  <button className="btn btn-sm btn-outline w-full sm:w-auto" onClick={() => exportCSV('messages.csv', messages, [
                    { label: 'Sender', value: r => r.senderId?.fullName || '' },
                    { label: 'Receiver', value: r => r.receiverId?.fullName || '' },
                    { label: 'Text', value: r => r.text || '' },
                    { label: 'Timestamp', value: r => new Date(r.createdAt).toISOString() }
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
                className={`tab tab-sm md:tab-md ${messagesSubTab === 'all' ? 'tab-active' : ''}`}
                onClick={() => setMessagesSubTab('all')}
              >
                <span className="text-xs md:text-sm">All Messages</span>
              </button>
              <button
                className={`tab tab-sm md:tab-md ${messagesSubTab === 'conversations' ? 'tab-active' : ''}`}
                onClick={() => setMessagesSubTab('conversations')}
              >
                <span className="text-xs md:text-sm">Conversations</span>
              </button>
            </div>

            {messagesSubTab === 'all' && (
              <div className="form-control">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                  <input
                    value={q}
                    onChange={(e) => { setQ(e.target.value); setPage(1); }}
                    className="input input-sm input-bordered pl-9 pr-4 w-full"
                    placeholder="Search messages..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {messagesSubTab === 'all' ? (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-2 md:p-4">
            {loading && (
              <div className="px-4 pb-2">
                <div className="animate-pulse text-xs opacity-60">Loading messages...</div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
              <div className="form-control">
                <label className="label cursor-pointer gap-2">
                  <span className="label-text text-xs">Per page</span>
                  <select className="select select-xs select-bordered" value={perPage} onChange={(e) => { setPage(1); setPerPage(Number(e.target.value)); }}>
                    <option value={50}>50</option>
                    <option value={75}>75</option>
                  </select>
                </label>
              </div>
              <div className="join">
                <button className="join-item btn btn-xs" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                <button className="join-item btn btn-xs" onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="table table-zebra w-full text-sm">
                <thead>
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
                    <th className="w-20">Avatar</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Message</th>
                    <th>Time</th>
                    <th className="w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {messages.map((msg) => (
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
                      <td className={`font-medium ${!msg.receiverId?.fullName ? 'italic text-base-content/50' : ''}`}>
                        {msg.receiverId?.fullName || 'Deleted User'}
                      </td>
                      <td className="max-w-md">
                        <div className="truncate">
                          {msg.text || msg.image ? (
                            <>
                              {msg.text}
                              {msg.image && <span className="badge badge-primary badge-sm ml-1">Image</span>}
                            </>
                          ) : msg.attachments?.length > 0 ? (
                            <span className="badge badge-secondary badge-sm">{msg.attachments.length} Attachment(s)</span>
                          ) : msg.audio ? (
                            <span className="badge badge-accent badge-sm">Voice Message</span>
                          ) : (
                            <span className="text-base-content/40">[No text content]</span>
                          )}
                        </div>
                      </td>
                      <td className="text-xs text-base-content/70">
                        <div>{new Date(msg.createdAt).toLocaleDateString()}</div>
                        <div>{new Date(msg.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {msg.text && (
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            className="btn btn-xs btn-error btn-outline"
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
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-2">
              {messages.map((msg) => (
                <div key={msg._id} className={`card shadow-sm ${selectedMessages.includes(msg._id) ? 'bg-primary/10 border-2 border-primary' : 'bg-base-200'}`}>
                  <div className="card-body p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <label>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedMessages.includes(msg._id)}
                          onChange={() => toggleMessageSelection(msg._id)}
                        />
                      </label>
                      <div className="avatar">
                        <div className="w-6 h-6 rounded-full">
                          <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                          {msg.senderId?.fullName || 'Deleted User'}
                        </div>
                        <div className="text-xs text-base-content/60">
                          To: <span className={!msg.receiverId?.fullName ? 'italic text-base-content/50' : ''}>
                            {msg.receiverId?.fullName || 'Deleted User'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-base-content/60">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="text-sm text-base-content/80 mb-2">
                      {msg.text || msg.image ? (
                        <>
                          {msg.text}
                          {msg.image && <span className="badge badge-primary badge-sm ml-1">Image</span>}
                        </>
                      ) : msg.attachments?.length > 0 ? (
                        <span className="badge badge-secondary badge-sm">{msg.attachments.length} Attachment(s)</span>
                      ) : msg.audio ? (
                        <span className="badge badge-accent badge-sm">Voice Message</span>
                      ) : (
                        <span className="text-base-content/40">[No text content]</span>
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
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-2 md:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[70vh]">
              {/* Conversations list */}
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
                    <button className="join-item btn btn-sm" onClick={() => setConvPage(p => p + 1)} disabled={conversations.length < convPerPage}>Next</button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="loading loading-spinner loading-md"></span>
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No conversations found</p>
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {conversations.map((c, idx) => {
                      const isActive = selectedConversation &&
                        ((selectedConversation.a === c.sender._id && selectedConversation.b === c.receiver._id) ||
                          (selectedConversation.a === c.receiver._id && selectedConversation.b === c.sender._id));

                      return (
                        <button
                          key={idx}
                          className={`w-full p-3 rounded-lg transition-all hover:bg-base-200 text-left ${isActive ? 'bg-primary/10 border-2 border-primary' : 'bg-base-100 border-2 border-transparent'
                            }`}
                          onClick={() => onSelectConversation(c.sender._id, c.receiver._id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatars */}
                            <div className="avatar-group -space-x-3">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full ring ring-base-100">
                                  <img src={c.sender.profilePic || '/avatar.png'} alt={c.sender.fullName} />
                                </div>
                              </div>
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full ring ring-base-100">
                                  <img src={c.receiver.profilePic || '/avatar.png'} alt={c.receiver.fullName} />
                                </div>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="text-sm font-semibold truncate">
                                  {c.sender.fullName} & {c.receiver.fullName}
                                </div>
                                <span className="badge badge-primary badge-sm flex-shrink-0">{c.count || 0}</span>
                              </div>

                              <div className="text-xs text-base-content/60 mb-1">
                                {c.sender.email} ↔ {c.receiver.email}
                              </div>

                              {c.lastMessage && (
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="text-xs text-base-content/70 truncate flex-1">
                                    <span className="font-medium">{c.lastMessage.senderId?.fullName || 'User'}:</span>{' '}
                                    {c.lastMessage.text || '[media]'}
                                  </div>
                                  <div className="text-xs text-base-content/50 flex-shrink-0">
                                    {new Date(c.lastMessage.createdAt).toLocaleDateString()}
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

              {/* Thread messages */}
              <div className="lg:col-span-2 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Search bar */}
                    <div className="mb-4">
                      <div className="form-control">
                        <div className="relative">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                          <input
                            value={dmThreadQ}
                            onChange={(e) => {
                              setDmThreadQ(e.target.value);
                              if (selectedConversation) onSelectConversation(selectedConversation.a, selectedConversation.b);
                            }}
                            className="input input-sm input-bordered pl-9 pr-4 w-full"
                            placeholder="Search in conversation..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Messages count */}
                    {threadMessages.length > 0 && (
                      <div className="mb-3 text-xs text-base-content/60 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span>{threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''} in this conversation</span>
                      </div>
                    )}

                    {/* Desktop Table View */}
                    <div className="hidden md:block flex-1 overflow-y-auto max-h-[70vh]">
                      {threadMessages.length === 0 ? (
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
                              <th className="w-32">From</th>
                              <th>Message</th>
                              <th className="w-40">Time</th>
                              <th className="w-24">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {threadMessages.map((msg) => (
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

                    {/* Mobile Card View - Keep original */}
                    <div className="md:hidden flex-1 overflow-y-auto max-h-[70vh]">
                      <div className="bg-base-200/30 min-h-full p-3 space-y-3 pb-32">
                        {threadMessages.length === 0 ? (
                          <div className="text-center py-12 text-base-content/60">
                            <MessageSquare className="w-16 h-16 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">No messages found</p>
                          </div>
                        ) : (

                          <>
                            {/* Select All Bar */}
                            <div className="flex items-center justify-between bg-base-100 rounded-lg p-2 shadow-sm sticky top-0 z-10">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs"
                                  checked={allSelected}
                                  onChange={(e) => e.target.checked ? selectAllMessages() : deselectAllMessages()}
                                />
                                <span className="text-xs font-medium">
                                  {allSelected ? 'Deselect All' : 'Select All'}
                                </span>
                              </label>
                              {selectedMessages.length > 0 && (
                                <div className="badge badge-primary badge-sm">{selectedMessages.length}</div>
                              )}
                            </div>

                            {/* Messages */}
                            {threadMessages.map((msg, idx) => {
                              const prevMsg = idx > 0 ? threadMessages[idx - 1] : null;
                              const isSameSender = prevMsg?.senderId?._id === msg.senderId?._id;
                              const timeDiff = prevMsg ? new Date(msg.createdAt) - new Date(prevMsg.createdAt) : 0;
                              const showAvatar = !isSameSender || timeDiff > 300000;

                              return (
                                <div key={msg._id} className="flex items-start gap-2">
                                  {/* Checkbox */}
                                  <label className="mt-1">
                                    <input
                                      type="checkbox"
                                      className="checkbox checkbox-xs"
                                      checked={selectedMessages.includes(msg._id)}
                                      onChange={() => toggleMessageSelection(msg._id)}
                                    />
                                  </label>

                                  {/* Avatar */}
                                  <div className="flex-shrink-0">
                                    {showAvatar ? (
                                      <div className="avatar">
                                        <div className="w-8 h-8 rounded-full">
                                          <img src={msg.senderId?.profilePic || '/avatar.png'} alt="" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8"></div>
                                    )}
                                  </div>

                                  {/* Message Content */}
                                  <div className="flex-1 min-w-0">
                                    {showAvatar && (
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-semibold ${!msg.senderId?.fullName ? 'italic text-base-content/50' : ''}`}>
                                          {msg.senderId?.fullName || 'Deleted User'}
                                        </span>
                                        <span className="text-xs text-base-content/50">
                                          {new Date(msg.createdAt).toLocaleTimeString()}
                                        </span>
                                      </div>
                                    )}

                                    <div className={`bg-base-100 rounded-lg p-2 shadow-sm ${selectedMessages.includes(msg._id) ? 'ring-2 ring-primary' : ''}`}>
                                      {msg.text && (
                                        <div className="text-sm mb-1 whitespace-pre-wrap break-words">{msg.text}</div>
                                      )}

                                      {(msg.image || msg.attachments?.length > 0 || msg.audio) && (
                                        <div className="flex flex-wrap gap-1 mb-1">
                                          {msg.image && (
                                            <div className="badge badge-primary badge-xs gap-1">
                                              <Camera className="w-2 h-2" />
                                              Image
                                            </div>
                                          )}
                                          {msg.attachments?.length > 0 && (
                                            <div className="badge badge-secondary badge-xs gap-1">
                                              <FileText className="w-2 h-2" />
                                              {msg.attachments.length}
                                            </div>
                                          )}
                                          {msg.audio && (
                                            <div className="badge badge-accent badge-xs">Voice</div>
                                          )}
                                        </div>
                                      )}

                                      {!msg.text && !msg.image && !msg.attachments?.length && !msg.audio && (
                                        <span className="text-xs text-base-content/40 italic">[No content]</span>
                                      )}

                                      {/* Actions */}
                                      <div className="flex gap-1 mt-2">
                                        {msg.text && (
                                          <button
                                            className="btn btn-xs btn-ghost"
                                            onClick={() => setEditModal({ type: 'messages', id: msg._id, data: { text: msg.text } })}
                                          >
                                            <Edit2 className="w-3 h-3" />
                                          </button>
                                        )}
                                        <button
                                          className="btn btn-xs btn-error btn-ghost"
                                          onClick={() => setDeleteModal({ type: 'messages', id: msg._id, name: 'this message' })}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-base-content/60">
                    <div className="text-center">
                      <MessageSquare className="w-20 h-20 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium mb-2">Select a conversation</p>
                      <p className="text-sm">Choose a conversation from the list to view messages</p>
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
