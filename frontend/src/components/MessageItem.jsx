import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { AlertCircle, RotateCcw, Edit, Trash2, Quote, FileText, MoreVertical, Phone, Video, Download, Maximize2 } from "lucide-react";
import useLongPress from "../hooks/useLongPress";
import Avatar from "./Avatar";
import AudioPlayer from "./AudioPlayer";
import ImagePreviewModal from "./ImagePreviewModal";
import MessageWithLinkPreviews from "./MessageWithLinkPreviews";

const MessageItem = ({ message, onEdit, onDelete, onQuote, selectedUser, selectedGroup, groupPosition, isUnread }) => {
  const { authUser } = useAuthStore();
  const { sendMessage } = useChatStore();

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState('bottom'); // 'bottom' or 'top'
  const [imageLoading, setImageLoading] = useState(!!message.image);
  const [attachmentLoadingStates, setAttachmentLoadingStates] = useState({});
  const [imageMenuOpen, setImageMenuOpen] = useState(null); // Track which image menu is open
  const [previewImage, setPreviewImage] = useState(null); // For full preview modal
  const messageRef = useRef(null);
  const dropdownRef = useRef(null);

  // Reset image loading state when message image changes
  useEffect(() => {
    if (message.image) {
      setImageLoading(true);
    }
  }, [message.image]);

  // Reset attachment loading states when attachments change
  useEffect(() => {
    if (message.attachments && message.attachments.length > 0) {
      const initialStates = {};
      message.attachments.forEach((_, idx) => {
        initialStates[idx] = true;
      });
      setAttachmentLoadingStates(initialStates);
    }
  }, [message.attachments]);

  const senderId = typeof message.senderId === 'object' && message.senderId ? message.senderId._id : message.senderId;
  const senderObj = typeof message.senderId === 'object' && message.senderId ? message.senderId : null;
  const isOwnMessage = senderId === authUser?._id;

  // Get sender info
  const getSenderInfo = () => {
    // Check if sender was deleted
    if (message.senderDeleted) {
      return { name: 'Deleted User', avatar: null, isDeleted: true };
    }

    if (isOwnMessage) return { name: 'You', avatar: authUser?.profilePic };
    if (senderObj) return { name: senderObj.fullName, avatar: senderObj.profilePic };
    if (selectedUser) return { name: selectedUser.fullName, avatar: selectedUser.profilePic };
    if (selectedGroup) {
      // Check if sender is the admin
      const adminId = typeof selectedGroup.admin === 'object' ? selectedGroup.admin._id : selectedGroup.admin;
      if (adminId === senderId) {
        const adminInfo = typeof selectedGroup.admin === 'object' ? selectedGroup.admin : null;
        return { 
          name: adminInfo?.fullName || 'Admin', 
          avatar: adminInfo?.profilePic || null 
        };
      }
      // Check in members array
      if (Array.isArray(selectedGroup.members)) {
        const member = selectedGroup.members.find(m => m._id === senderId);
        if (member) {
          return { name: member.fullName, avatar: member.profilePic };
        }
      }
      // If member not found in group, they might be deleted
      return { name: 'Deleted User', avatar: null, isDeleted: true };
    }
    return { name: 'Deleted User', avatar: null, isDeleted: true };
  };

  const senderInfo = getSenderInfo();
  const showAvatar = groupPosition === 'single' || groupPosition === 'start';

  const formattedTime = (() => {
    const d = new Date(message.createdAt);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12; if (h === 0) h = 12;
    return `${h}:${m} ${ap}`;
  })();

  const handleRetry = async () => {
    if (!message.isOptimistic || message.status !== 'failed') return;

    // Create new message data from the failed message
    const messageData = {
      text: message.text,
      image: message.image
    };

    // Send to the appropriate recipient
    if (message.groupId) {
      await sendMessage({
        ...messageData,
        groupId: message.groupId
      });
    } else {
      await sendMessage(messageData);
    }

    // The original failed message will be filtered out in the UI
    // when we get the response from the server
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Close image menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (imageMenuOpen && !event.target.closest('.group/image') && !event.target.closest('.group/attachment')) {
        setImageMenuOpen(null);
      }
    };

    if (imageMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [imageMenuOpen]);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setShowContextMenu(false);
    setShowDropdown(false);
    onEdit(message);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowContextMenu(false);
    setShowDropdown(false);
    onDelete(message._id);
  };

  const handleLongPress = () => {
    // Show context menu for all messages on mobile
    setShowContextMenu(true);
  };

  const handleClick = () => {
    // Regular click handler - can be extended if needed
  };

  const longPressEvents = useLongPress(handleLongPress, handleClick, 500);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showContextMenu && messageRef.current && !messageRef.current.contains(event.target)) {
        setShowContextMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);



  const [docPreview, setDocPreview] = useState(null); // {url, filename}

  return (
    <div
      className={`px-2 md:px-4 py-1 ${showAvatar ? 'mt-2' : 'mt-0.5'} group relative message-item`}
      data-message-id={message._id}
      role="listitem"
    >
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end gap-2`}>
        {/* Avatar for received messages */}
        {!isOwnMessage && showAvatar && (
          <div className="flex-shrink-0 mb-1">
            <Avatar
              src={senderInfo.avatar}
              name={senderInfo.name}
              size="w-8 h-8"
              className="rounded-full"
            />
          </div>
        )}

        {/* Spacer for consecutive messages to maintain alignment */}
        {!isOwnMessage && !showAvatar && (
          <div className="w-8 flex-shrink-0 mb-1"></div>
        )}

        {/* Message bubble */}
        <div
          ref={messageRef}
          className={`max-w-[70%] ${message.audio?.url ? 'min-w-[300px]' : 'min-w-[100px]'} rounded-lg px-3 py-2 pr-9 relative group ${isOwnMessage
            ? 'bg-primary text-primary-content ml-auto'
            : isUnread && !isOwnMessage
              ? 'bg-accent/30 text-base-content border-l-4 border-accent shadow-md'
              : 'bg-base-200 text-base-content'
            }`}
          {...longPressEvents}
        >
          {/* Three-dot menu button - Always visible */}
          <div className="absolute top-1 right-1" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();

                // Detect if message is near bottom of viewport
                if (messageRef.current && !showDropdown) {
                  const rect = messageRef.current.getBoundingClientRect();
                  const viewportHeight = window.innerHeight;
                  const spaceBelow = viewportHeight - rect.bottom;
                  const spaceAbove = rect.top;

                  // If less than 200px space below and more space above, show dropdown upward
                  if (spaceBelow < 200 && spaceAbove > spaceBelow) {
                    setDropdownPosition('top');
                  } else {
                    setDropdownPosition('bottom');
                  }
                }

                setShowDropdown(!showDropdown);
              }}
              className={`btn btn-xs btn-circle btn-ghost min-h-0 h-6 w-6 transition-all ${isOwnMessage
                ? 'text-primary-content/70 hover:text-primary-content hover:bg-white/25 hover:shadow-md active:bg-white/30'
                : 'text-base-content/60 hover:text-base-content hover:bg-base-300 hover:shadow-sm active:bg-base-300/80'
                }`}
              title="Message options"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} ${dropdownPosition === 'top' ? 'bottom-7' : 'top-7'} bg-base-100 border border-base-300 rounded-lg shadow-xl py-1.5 min-w-[120px] z-50 ${dropdownPosition === 'top' ? 'dropdown-menu-animate-up origin-bottom-right' : 'dropdown-menu-animate origin-top-right'}`}>
                {/* Quote option - available for all messages */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    onQuote?.(message);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 active:bg-base-300 flex items-center gap-2.5 text-base-content transition-all duration-150 rounded-md mx-1"
                >
                  <Quote className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Quote</span>
                </button>

                {/* Edit option - only for own messages with text */}
                {isOwnMessage && message.text && (
                  <button
                    onClick={handleEditClick}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 active:bg-base-300 flex items-center gap-2.5 text-base-content transition-all duration-150 rounded-md mx-1"
                  >
                    <Edit className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Edit</span>
                  </button>
                )}

                {/* Delete option - only for own messages */}
                {isOwnMessage && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-error/10 active:bg-error/20 flex items-center gap-2.5 text-error transition-all duration-150 rounded-md mx-1"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sender name for group chats (received messages only) */}
          {!isOwnMessage && selectedGroup && showAvatar && (
            <div className="text-xs font-semibold mb-1 opacity-70">
              <span className={senderInfo.isDeleted ? 'italic text-base-content/50' : ''}>
                {senderInfo.name}
              </span>
              {message.isGroupAdmin && !senderInfo.isDeleted && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1 py-0.5 rounded">
                  Admin
                </span>
              )}
            </div>
          )}

          {/* Message content container */}
          <div className="leading-normal">
            {/* Quoted message */}
            {message.quotedMessage && (() => {
              const q = message.quotedMessage;
              
              // Extract sender ID and info - handle both object and string formats
              let qSenderId = null;
              let qSenderObj = null;
              
              if (typeof q.senderId === 'object' && q.senderId) {
                qSenderId = q.senderId._id || q.senderId.id;
                qSenderObj = q.senderId; // Keep the populated object
              } else {
                qSenderId = q.senderId;
              }
              
              let qName = 'Unknown';
              
              // Convert to string for comparison
              const qSenderIdStr = qSenderId?.toString();
              const authUserIdStr = authUser?._id?.toString();
              
              // Check if it's the current user
              if (qSenderIdStr && authUserIdStr && qSenderIdStr === authUserIdStr) {
                qName = 'You';
              }
              // If senderId is populated with user data, use it directly
              else if (qSenderObj && qSenderObj.fullName) {
                qName = qSenderObj.fullName;
              }
              // Check if it's a direct chat user
              else if (selectedUser && qSenderIdStr === selectedUser._id?.toString()) {
                qName = selectedUser.fullName;
              }
              // Check in group
              else if (selectedGroup && qSenderIdStr) {
                // Check if sender is the admin
                const adminId = typeof selectedGroup.admin === 'object' ? selectedGroup.admin._id : selectedGroup.admin;
                const adminIdStr = adminId?.toString();
                
                if (adminIdStr === qSenderIdStr) {
                  qName = typeof selectedGroup.admin === 'object' ? selectedGroup.admin.fullName : 'Admin';
                }
                // Check in members array
                else if (Array.isArray(selectedGroup.members)) {
                  const m = selectedGroup.members.find(m => m._id?.toString() === qSenderIdStr);
                  if (m) qName = m.fullName;
                }
              }
              
              return (
                <div className={`border-l-4 pl-3 py-2 mb-2 rounded-r-md ${isOwnMessage
                  ? 'bg-primary-content/10 border-primary-content/30'
                  : 'bg-base-300/20 border-base-content/30'
                  }`}>
                  <div className={`text-xs font-medium mb-1 ${isOwnMessage ? 'text-primary-content/70' : 'text-base-content/60'
                    }`}>
                    {qName}
                  </div>
                  <div className={`text-sm ${isOwnMessage ? 'text-primary-content/80' : 'text-base-content/70'
                    }`}>
                    {q.text}
                  </div>
                </div>
              );
            })()}

            {/* Message text */}
            {message.text && (
              <div className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${isOwnMessage ? 'text-primary-content' : 'text-base-content'
                }`}>
                {(() => {
                  // Replace [CALL_ICON] with actual icon
                  if (message.text.includes('[CALL_ICON]')) {
                    const isVideo = message.text.toLowerCase().includes('video');
                    const isDeclined = message.text.toLowerCase().includes('declined');
                    const textWithoutIcon = message.text.replace('[CALL_ICON]', '').trim();

                    return (
                      <div className={`flex items-center gap-2 ${isDeclined ? 'opacity-70' : ''}`}>
                        <div className={`p-2 rounded-full ${isOwnMessage ? 'bg-primary-content/20' : 'bg-primary/20'}`}>
                          {isVideo ? (
                            <Video className={`w-4 h-4 ${isOwnMessage ? 'text-primary-content' : 'text-primary'}`} />
                          ) : (
                            <Phone className={`w-4 h-4 ${isOwnMessage ? 'text-primary-content' : 'text-primary'}`} />
                          )}
                        </div>
                        <MessageWithLinkPreviews text={textWithoutIcon} mentions={message.mentions} isOwnMessage={isOwnMessage} />
                      </div>
                    );
                  }
                  return <MessageWithLinkPreviews text={message.text} mentions={message.mentions} isOwnMessage={isOwnMessage} />;
                })()}
              </div>
            )}

            {/* Message image */}
            {message.image && (
              <div className="mt-2 relative group/image">
                {/* Skeleton loader */}
                {imageLoading && !message.isOptimistic && (
                  <div className="skeleton w-full max-w-sm h-64 rounded-lg"></div>
                )}
                
                <img
                  src={message.image}
                  alt="Message attachment"
                  className={`rounded-lg max-w-sm max-h-80 w-full object-contain cursor-pointer hover:opacity-90 transition-opacity ${
                    message.isOptimistic ? 'opacity-90' : ''
                  } ${imageLoading && !message.isOptimistic ? 'hidden' : 'block'}`}
                  loading="eager"
                  onLoad={() => {
                    console.log('Image loaded:', message.image);
                    setImageLoading(false);
                  }}
                  onError={(e) => {
                    console.error('Image failed to load:', message.image);
                    setImageLoading(false);
                    // Show broken image placeholder
                    e.target.style.display = 'none';
                  }}
                  onClick={() => !message.isOptimistic && setPreviewImage({ src: message.image, alt: 'Message image' })}
                />
                
                {/* Uploading indicator */}
                {message.isOptimistic && (
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="loading loading-spinner loading-xs"></span>
                    Uploading...
                  </div>
                )}
                
                {/* Image menu - shows on hover or when open */}
                {!message.isOptimistic && !imageLoading && (
                  <div className={`absolute top-2 right-2 ${imageMenuOpen === 'main' ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100'} transition-opacity`}>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageMenuOpen(imageMenuOpen === 'main' ? null : 'main');
                        }}
                        className="btn btn-circle btn-xs bg-black/50 hover:bg-black/70 text-white border-none"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                      
                      {imageMenuOpen === 'main' && (
                        <div className="absolute right-0 top-8 bg-base-100 border border-base-300 rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewImage({ src: message.image, alt: 'Message image' });
                              setImageMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2"
                          >
                            <Maximize2 className="w-4 h-4" />
                            Full Preview
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const response = await fetch(message.image);
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'image.jpg';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(url);
                              } catch (error) {
                                console.error('Failed to download:', error);
                              }
                              setImageMenuOpen(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Attachments */}
            {Array.isArray(message.attachments) && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((a, idx) => (
                  a.contentType?.startsWith('image/') ? (
                    <div key={idx} className="relative group/attachment">
                      {/* Skeleton loader */}
                      {attachmentLoadingStates[idx] !== false && (
                        <div className="skeleton w-full max-w-sm h-64 rounded-lg"></div>
                      )}
                      
                      <img
                        src={a.url}
                        alt={a.filename || 'image'}
                        className={`rounded-lg max-w-sm max-h-80 w-full object-contain cursor-pointer hover:opacity-90 transition-opacity ${
                          attachmentLoadingStates[idx] === false ? 'block' : 'hidden'
                        }`}
                        loading="eager"
                        onLoad={() => {
                          console.log('Attachment image loaded:', a.url);
                          setAttachmentLoadingStates(prev => ({ ...prev, [idx]: false }));
                        }}
                        onError={(e) => {
                          console.error('Attachment image failed to load:', a.url);
                          setAttachmentLoadingStates(prev => ({ ...prev, [idx]: false }));
                          e.target.style.display = 'none';
                        }}
                        onClick={() => setPreviewImage({ src: a.url, alt: a.filename || 'Attachment' })}
                      />
                      
                      {/* Image menu */}
                      {attachmentLoadingStates[idx] === false && (
                        <div className={`absolute top-2 right-2 ${imageMenuOpen === `attachment-${idx}` ? 'opacity-100' : 'opacity-0 group-hover/attachment:opacity-100'} transition-opacity`}>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setImageMenuOpen(imageMenuOpen === `attachment-${idx}` ? null : `attachment-${idx}`);
                              }}
                              className="btn btn-circle btn-xs bg-black/50 hover:bg-black/70 text-white border-none"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>
                            
                            {imageMenuOpen === `attachment-${idx}` && (
                              <div className="absolute right-0 top-8 bg-base-100 border border-base-300 rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage({ src: a.url, alt: a.filename || 'Attachment' });
                                    setImageMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2"
                                >
                                  <Maximize2 className="w-4 h-4" />
                                  Full Preview
                                </button>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const response = await fetch(a.url);
                                      const blob = await response.blob();
                                      const url = window.URL.createObjectURL(blob);
                                      const link = document.createElement('a');
                                      link.href = url;
                                      link.download = a.filename || 'image.jpg';
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                      window.URL.revokeObjectURL(url);
                                    } catch (error) {
                                      console.error('Failed to download:', error);
                                    }
                                    setImageMenuOpen(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2"
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : a.contentType === 'application/pdf' ? (
                    <div key={idx} className={`rounded-lg p-3 flex items-center justify-between max-w-sm border-2 ${
                      isOwnMessage 
                        ? 'bg-primary-content/20 border-primary-content/40' 
                        : 'bg-base-200/50 border-base-300/50'
                    }`}>
                      <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                        <FileText className={`w-5 h-5 flex-shrink-0 ${isOwnMessage ? 'text-primary-content' : 'text-base-content/60'}`} />
                        <span className={`truncate font-medium ${isOwnMessage ? 'text-primary-content' : 'text-base-content/80'}`}>{a.filename || 'PDF'}</span>
                      </div>
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <button
                          className={`btn btn-xs ${isOwnMessage ? 'bg-primary-content/30 hover:bg-primary-content/40 text-primary-content border-primary-content/40' : 'btn-ghost'}`}
                          onClick={() => setDocPreview({ url: a.url, filename: a.filename || 'Document' })}
                        >
                          View
                        </button>
                        <a
                          href={a.url}
                          download={a.filename || 'document.pdf'}
                          className={`btn btn-xs ${isOwnMessage ? 'bg-primary-content/30 hover:bg-primary-content/40 text-primary-content border-primary-content/40' : 'btn-ghost'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className={`rounded-lg p-3 flex items-center justify-between max-w-sm border-2 ${
                      isOwnMessage 
                        ? 'bg-primary-content/20 border-primary-content/40' 
                        : 'bg-base-200/50 border-base-300/50'
                    }`}>
                      <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                        <FileText className={`w-5 h-5 flex-shrink-0 ${isOwnMessage ? 'text-primary-content' : 'text-base-content/60'}`} />
                        <span className={`truncate font-medium ${isOwnMessage ? 'text-primary-content' : 'text-base-content/80'}`}>{a.filename || a.contentType || 'File'}</span>
                      </div>
                      <a
                        href={a.url}
                        download={a.filename || 'file'}
                        className={`btn btn-xs ${isOwnMessage ? 'bg-primary-content/30 hover:bg-primary-content/40 text-primary-content border-primary-content/40' : 'btn-ghost'} ml-2 flex-shrink-0`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </a>
                    </div>
                  )
                ))}
              </div>
            )}
            {/* Audio */}
            {message.audio?.url && (
              <div className="mt-2">
                <AudioPlayer src={message.audio.url} isOwnMessage={isOwnMessage} />
              </div>
            )}

            {/* Timestamp and status at bottom right of bubble */}
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className={`text-xs ${isOwnMessage ? 'text-primary-content/70' : 'text-base-content/60'}`}>
                {formattedTime}
              </span>
              {isOwnMessage && (
                <div className="flex items-center">
                  {message.status === 'pending' && (
                    <span className="loading loading-spinner loading-xs opacity-60"></span>
                  )}
                  {message.status === 'failed' && (
                    <AlertCircle className="w-3 h-3 text-error" />
                  )}
                  {message.status === 'sent' && (
                    <div className="text-primary-content/70">✓</div>
                  )}
                  {message.status === 'delivered' && (
                    <div className="text-primary-content/70">✓✓</div>
                  )}
                </div>
              )}
            </div>

            {/* Retry button for failed messages */}
            {isOwnMessage && message.status === 'failed' && (
              <div className="mt-1">
                <button
                  onClick={handleRetry}
                  className="btn btn-xs btn-ghost text-error hover:bg-error/10"
                  title="Retry sending message"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Avatar for sent messages is not shown */}
      </div>

      {/* Floating action buttons on hover - positioned above message */}
      <div className={`absolute -top-8 ${isOwnMessage ? 'right-4' : 'left-12'} hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-base-100 border border-base-300 rounded-lg shadow-lg p-1 z-20`}>
        <button
          onClick={(e) => { e.stopPropagation(); onQuote?.(message); }}
          className="btn btn-xs btn-ghost hover:bg-base-300/50 text-base-content/60 hover:text-base-content"
          title="Quote message"
        >
          <Quote className="w-4 h-4" />
        </button>
        {isOwnMessage && message.status !== 'failed' && (
          <button
            onClick={handleEditClick}
            className="btn btn-xs btn-ghost hover:bg-base-300/50 text-base-content/60 hover:text-base-content"
            title="Edit message"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        {isOwnMessage && (
          <button
            onClick={handleDeleteClick}
            className="btn btn-xs btn-ghost text-error/60 hover:text-error hover:bg-error/10"
            title="Delete message"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Context menu for mobile long press */}
      {showContextMenu && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setShowContextMenu(false)}
          />

          {/* Context menu */}
          <div className={`fixed md:absolute ${isOwnMessage ? 'right-4' : 'left-4'} bottom-20 md:top-0 md:right-0 md:mt-[-45px] z-50 md:z-10`}>
            <div className="menu bg-base-100 text-base-content rounded-xl shadow-2xl border border-base-200 w-56 p-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
              {/* Quote option - available for all messages */}
              <li>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContextMenu(false);
                    onQuote?.(message);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                  title="Quote message"
                >
                  <Quote size={18} className="text-base-content/70" />
                  <span className="text-base font-medium">Quote</span>
                </button>
              </li>

              {/* Edit option - only for own messages with text */}
              {isOwnMessage && message.text && message.status !== 'failed' && (
                <li>
                  <button
                    onClick={handleEditClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-base-200 active:bg-base-300 transition-colors"
                    title="Edit message"
                  >
                    <Edit size={18} className="text-base-content/70" />
                    <span className="text-base font-medium">Edit</span>
                  </button>
                </li>
              )}

              {/* Delete option - only for own messages */}
              {isOwnMessage && (
                <li>
                  <button
                    onClick={handleDeleteClick}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-error/10 active:bg-error/20 transition-colors"
                    title="Delete message"
                  >
                    <Trash2 size={18} className="text-error" />
                    <span className="text-base font-medium text-error">Delete</span>
                  </button>
                </li>
              )}
            </div>
          </div>
        </>
      )}

      {/* Document preview modal */}
      {docPreview && (
        <dialog className="modal modal-open">
          <div className="modal-box bg-base-100 text-base-content w-full max-w-3xl h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-2 border-b border-base-300">
              <div className="text-sm font-medium truncate pr-2">{docPreview.filename}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setDocPreview(null)}>Close</button>
            </div>
            <iframe src={docPreview.url} title="Document" className="w-full h-full" />
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setDocPreview(null)}>close</button>
          </form>
        </dialog>
      )}

      {/* Image preview modal */}
      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default MessageItem;