import { useState, useEffect, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { AlertCircle, RotateCcw, Edit, Trash2, Quote, FileText, MoreVertical, Phone, Video, Download, Maximize2, FileArchive, FileCode, FileSpreadsheet, FileVideo, FileAudio, File, Smile, X } from "lucide-react";
import useLongPress from "../hooks/useLongPress";
import { hapticMedium, hapticLight } from "../utils/haptic";
import Avatar from "./Avatar";
import PremiumBadge from "./PremiumBadge";
import AudioPlayer from "./AudioPlayer";
import ImagePreviewModal from "./ImagePreviewModal";
import MessageWithLinkPreviews from "./MessageWithLinkPreviews";
import FormattedMessageText from "./FormattedMessageText";
import { useMessageReadDetection } from "../hooks/useMessageReadDetection";

// Utility function to detect if text contains only emojis (1-3)
const isEmojiOnly = (text) => {
  if (!text || typeof text !== 'string') return { isEmoji: false, count: 0 };
  
  // Remove whitespace
  const trimmed = text.trim();
  if (!trimmed) return { isEmoji: false, count: 0 };
  
  // Emoji regex pattern - matches most emojis including skin tones and ZWJ sequences
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  
  // Extract all emojis
  const emojis = trimmed.match(emojiRegex);
  if (!emojis) return { isEmoji: false, count: 0 };
  
  // Remove all emojis and check if anything else remains
  const withoutEmojis = trimmed.replace(emojiRegex, '').replace(/\s/g, '');
  
  // If there's text remaining, it's not emoji-only
  if (withoutEmojis.length > 0) return { isEmoji: false, count: 0 };
  
  // Count emojis (1-3 only)
  const count = emojis.length;
  return { isEmoji: count >= 1 && count <= 3, count };
};

const MessageItem = ({ message, onEdit, onDelete, onQuote, selectedUser, selectedGroup, groupPosition, isUnread, isNearBottom = false }) => {
  const { authUser } = useAuthStore();
  const { sendMessage } = useChatStore();

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  // Default to 'top' if isNearBottom, otherwise 'bottom'
  const [dropdownPosition, setDropdownPosition] = useState(isNearBottom ? 'top' : 'bottom'); // 'bottom' or 'top'
  const [imageLoading, setImageLoading] = useState(!!message.image);
  const [attachmentLoadingStates, setAttachmentLoadingStates] = useState({});
  const [imageMenuOpen, setImageMenuOpen] = useState(null); // Track which image menu is open
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // For full preview modal
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || []);
  const [isReactingToMessage, setIsReactingToMessage] = useState(false);
  const [reactionAnimation, setReactionAnimation] = useState(null); // { emoji, timestamp }
  const messageRef = useRef(null);
  const dropdownRef = useRef(null);

  // Automatic read detection
  const conversationId = selectedUser?._id || selectedGroup?._id;
  const { observeMessage } = useMessageReadDetection(conversationId, !!selectedGroup);

  // Update dropdown position when isNearBottom changes
  useEffect(() => {
    if (isNearBottom) {
      setDropdownPosition('top');
    }
  }, [isNearBottom]);

  // Update reactions when message changes
  useEffect(() => {
    setReactions(message.reactions || []);
  }, [message.reactions]);

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

  // Get sender info including premium status
  const getSenderInfo = () => {
    // Check if sender was deleted
    if (message.senderDeleted) {
      return { name: 'Deleted User', avatar: null, isDeleted: true, user: null };
    }

    if (isOwnMessage) return { name: 'You', avatar: authUser?.profilePic, user: authUser };
    if (senderObj) return { name: senderObj.fullName, avatar: senderObj.profilePic, user: senderObj };
    if (selectedUser) return { name: selectedUser.fullName, avatar: selectedUser.profilePic, user: selectedUser };
    if (selectedGroup) {
      // Check if sender is the admin
      const adminId = typeof selectedGroup.admin === 'object' ? selectedGroup.admin._id : selectedGroup.admin;
      if (adminId === senderId) {
        const adminInfo = typeof selectedGroup.admin === 'object' ? selectedGroup.admin : null;
        return { 
          name: adminInfo?.fullName || 'Admin', 
          avatar: adminInfo?.profilePic || null,
          user: adminInfo
        };
      }
      // Check in members array
      if (Array.isArray(selectedGroup.members)) {
        const member = selectedGroup.members.find(m => m._id === senderId);
        if (member) {
          return { name: member.fullName, avatar: member.profilePic, user: member };
        }
      }
      // If member not found in group, they might be deleted
      return { name: 'Deleted User', avatar: null, isDeleted: true, user: null };
    }
    return { name: 'Deleted User', avatar: null, isDeleted: true, user: null };
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

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showEmojiPicker]);

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

  const handleReactToMessage = async (emoji) => {
    try {
      setIsReactingToMessage(true);
      
      // Show animation immediately
      setReactionAnimation({ emoji, timestamp: Date.now() });
      
      // Scroll message into view
      if (messageRef.current) {
        messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      const { axiosInstance } = await import("../lib/axios");
      await axiosInstance.post(`/api/messages/${message._id}/react`, { emoji });
      setShowEmojiPicker(false);
      
      // Clear animation after 1 second
      setTimeout(() => setReactionAnimation(null), 1000);
    } catch (error) {
      console.error('Failed to react to message:', error);
      setReactionAnimation(null);
    } finally {
      setIsReactingToMessage(false);
    }
  };

  const getGroupedReactions = () => {
    // Group reactions by emoji
    const grouped = {};
    reactions.forEach(reaction => {
      if (!grouped[reaction.emoji]) {
        grouped[reaction.emoji] = [];
      }
      grouped[reaction.emoji].push(reaction);
    });
    return grouped;
  };

  const userHasReacted = (emoji) => {
    return reactions?.some(r => r.emoji === emoji && r.userId === authUser?._id);
  };

  const handleLongPress = () => {
    // Show context menu for all messages on mobile
    hapticMedium();
    setShowContextMenu(true);
  };

  const handleClick = () => {
    // Regular click handler - can be extended if needed
  };

  const longPressEvents = useLongPress(handleLongPress, handleClick, 300); // Reduced from 500ms to 300ms

  // Swipe-to-reply handlers
  const swipeHandlers = useSwipeable({
    onSwiping: (eventData) => {
      // Only allow swipe-right
      if (eventData.dir === 'Right' && eventData.deltaX > 0) {
        const offset = Math.min(eventData.deltaX, 80);
        setSwipeOffset(offset);
        setIsSwipeActive(true);
      }
    },
    onSwiped: (eventData) => {
      if (eventData.dir === 'Right' && eventData.deltaX > 50) {
        // Trigger reply
        onQuote(message);
        
        // Haptic feedback
        hapticLight();
      }
      
      // Reset
      setSwipeOffset(0);
      setIsSwipeActive(false);
    },
    trackMouse: false,
    trackTouch: true,
  });

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

  // Helper function to get file type info
  const getFileTypeInfo = (contentType, filename) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    
    // Video files
    if (contentType?.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
      return { icon: FileVideo, label: 'Video', color: 'text-purple-500', canPreview: true };
    }
    
    // Audio files
    if (contentType?.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      return { icon: FileAudio, label: 'Audio', color: 'text-blue-500', canPreview: true };
    }
    
    // PDF
    if (contentType === 'application/pdf' || ext === 'pdf') {
      return { icon: FileText, label: 'PDF', color: 'text-red-500', canPreview: true };
    }
    
    // Documents
    if (['doc', 'docx', 'odt', 'rtf'].includes(ext) || contentType?.includes('word')) {
      return { icon: FileText, label: 'Document', color: 'text-blue-600', canPreview: false };
    }
    
    // Spreadsheets
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext) || contentType?.includes('spreadsheet') || contentType?.includes('excel')) {
      return { icon: FileSpreadsheet, label: 'Spreadsheet', color: 'text-green-600', canPreview: false };
    }
    
    // Presentations
    if (['ppt', 'pptx', 'odp'].includes(ext) || contentType?.includes('presentation') || contentType?.includes('powerpoint')) {
      return { icon: FileText, label: 'Presentation', color: 'text-orange-600', canPreview: false };
    }
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) || contentType?.includes('zip') || contentType?.includes('compressed')) {
      return { icon: FileArchive, label: 'Archive', color: 'text-yellow-600', canPreview: false };
    }
    
    // Code files
    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'json', 'xml', 'yaml', 'yml', 'sh', 'php', 'rb', 'go', 'rs'].includes(ext)) {
      return { icon: FileCode, label: 'Code', color: 'text-indigo-600', canPreview: false };
    }
    
    // Text files
    if (contentType?.startsWith('text/') || ['txt', 'md', 'log'].includes(ext)) {
      return { icon: FileText, label: 'Text', color: 'text-gray-600', canPreview: false };
    }
    
    // Default
    return { icon: File, label: 'File', color: 'text-base-content/60', canPreview: false };
  };

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Attach read detection observer
  useEffect(() => {
    if (messageRef.current && message) {
      return observeMessage(messageRef.current, message);
    }
  }, [observeMessage, message]);

  return (
    <div
      className={`px-2 md:px-4 py-1 ${showAvatar ? 'mt-2' : 'mt-0.5'} relative message-item`}
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

        {/* Message bubble with swipe-to-reply */}
        <div 
          className="relative group"
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isSwipeActive ? 'none' : 'transform 0.2s ease-out'
          }}
        >
          {/* Reply icon that appears during swipe */}
          {swipeOffset > 20 && (
            <div 
              className="absolute left-2 top-1/2 -translate-y-1/2 text-primary z-10"
              style={{ 
                opacity: Math.min(swipeOffset / 50, 1),
                pointerEvents: 'none'
              }}
            >
              <Quote className="w-6 h-6" />
            </div>
          )}
          
          <div
            ref={messageRef}
            {...swipeHandlers}
            className={`max-w-md ${message.audio?.url ? 'min-w-[300px]' : 'min-w-[100px]'} rounded-lg px-3 py-2 pr-9 relative ${isOwnMessage
              ? 'bg-primary text-primary-content ml-auto'
              : isUnread && !isOwnMessage
                ? 'bg-accent/30 text-base-content border-l-4 border-accent shadow-md'
                : 'bg-base-200 text-base-content'
              }`}
            {...longPressEvents}
          >
          {/* Reaction Animation Overlay */}
          {reactionAnimation && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-6xl animate-ping-once">
                {reactionAnimation.emoji}
              </div>
            </div>
          )}
          
          {/* Three-dot menu button - Always visible */}
          <div className="absolute top-1 right-1" ref={dropdownRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();

                // Detect if message is near bottom of viewport or is one of last 3 messages
                if (messageRef.current && !showDropdown) {
                  const rect = messageRef.current.getBoundingClientRect();
                  const viewportHeight = window.innerHeight;
                  const spaceBelow = viewportHeight - rect.bottom;
                  
                  // Dropdown menu height is approximately 150-200px
                  const dropdownHeight = 200;

                  console.log('🔽 Dropdown position check:', {
                    messageId: message._id,
                    isNearBottom,
                    spaceBelow,
                    dropdownHeight,
                    shouldShowUpward: spaceBelow < dropdownHeight || isNearBottom
                  });

                  // If not enough space below OR this is one of the last 3 messages, show upward
                  if (spaceBelow < dropdownHeight || isNearBottom) {
                    console.log('⬆️ Setting dropdown to TOP');
                    setDropdownPosition('top');
                  } else {
                    console.log('⬇️ Setting dropdown to BOTTOM');
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
              <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} ${dropdownPosition === 'top' ? 'bottom-7' : 'top-7'} bg-base-100 border border-base-300 rounded-lg shadow-xl py-1.5 px-1.5 min-w-[160px] z-50 ${dropdownPosition === 'top' ? 'dropdown-menu-animate-up origin-bottom-right' : 'dropdown-menu-animate origin-top-right'}`}>
                {/* React option - available for all messages */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    // Small delay to ensure dropdown closes before emoji picker opens
                    setTimeout(() => setShowEmojiPicker(true), 50);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 active:bg-base-300 flex items-center gap-2.5 text-base-content transition-colors duration-150 rounded-md"
                >
                  <Smile className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">React</span>
                </button>

                {/* Quote option - available for all messages */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    onQuote?.(message);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 active:bg-base-300 flex items-center gap-2.5 text-base-content transition-colors duration-150 rounded-md"
                >
                  <Quote className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">Quote</span>
                </button>

                {/* Edit option - only for own messages with text */}
                {isOwnMessage && message.text && (
                  <button
                    onClick={handleEditClick}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-base-200 active:bg-base-300 flex items-center gap-2.5 text-base-content transition-colors duration-150 rounded-md"
                  >
                    <Edit className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Edit</span>
                  </button>
                )}

                {/* Delete option - only for own messages */}
                {isOwnMessage && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-error/10 active:bg-error/20 flex items-center gap-2.5 text-error transition-colors duration-150 rounded-md"
                  >
                    <Trash2 className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Delete</span>
                  </button>
                )}
              </div>
            )}

            {/* Floating emoji picker for reactions (from dropdown or add reaction button) */}
            {showEmojiPicker && !showDropdown && (
              <div className={`emoji-picker-container absolute ${dropdownPosition === 'top' ? 'bottom-7' : 'top-7'} ${isOwnMessage ? 'right-0' : 'left-0'} bg-base-100 border border-base-300 rounded-lg shadow-xl p-3 z-[60] grid grid-cols-6 gap-2 w-[240px]`}>
                {['👍', '❤️', '😂', '😢', '😡', '🔥', '👏', '🙏', '✨', '🎉', '😍', '🤔'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReactToMessage(emoji);
                    }}
                    className="text-2xl hover:scale-125 transition-transform duration-150 cursor-pointer p-2 rounded-lg hover:bg-base-200 flex items-center justify-center"
                    title={emoji}
                    disabled={isReactingToMessage}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sender name for group chats (received messages only) */}
          {!isOwnMessage && selectedGroup && showAvatar && (
            <div className="text-xs font-semibold mb-1 opacity-70 flex items-center gap-1">
              <span className={senderInfo.isDeleted ? 'italic text-base-content/50' : ''}>
                {senderInfo.name}
              </span>
              {senderInfo.user && (
                <PremiumBadge 
                  tier={senderInfo.user.subscriptionPlan || senderInfo.user.premiumTier} 
                  size="xs" 
                />
              )}
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
            {message.text && (() => {
              // Check if message is emoji-only (1-3 emojis)
              const emojiCheck = isEmojiOnly(message.text);
              
              return (
                <div className={`whitespace-pre-wrap break-words ${
                  emojiCheck.isEmoji 
                    ? 'text-6xl leading-none' // Large emojis for 1-3 emoji messages
                    : `text-sm leading-relaxed ${isOwnMessage ? 'text-primary-content' : 'text-base-content'}`
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
                    
                    // For emoji-only messages, render plain text (no formatting needed)
                    if (emojiCheck.isEmoji) {
                      return <span>{message.text}</span>;
                    }
                    
                    return <FormattedMessageText message={message} isOwnMessage={isOwnMessage} />;
                  })()}
                </div>
              );
            })()}

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
                          
                          // Check positioning before opening - also consider isNearBottom
                          if (messageRef.current && imageMenuOpen !== 'main') {
                            const rect = messageRef.current.getBoundingClientRect();
                            const viewportHeight = window.innerHeight;
                            const spaceBelow = viewportHeight - rect.bottom;
                            
                            if (spaceBelow < 200 || isNearBottom) {
                              setDropdownPosition('top');
                            } else {
                              setDropdownPosition('bottom');
                            }
                          }
                          
                          setImageMenuOpen(imageMenuOpen === 'main' ? null : 'main');
                        }}
                        className="btn btn-circle btn-xs bg-black/50 hover:bg-black/70 text-white border-none"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                      
                      {imageMenuOpen === 'main' && (
                        <div className={`absolute right-0 ${dropdownPosition === 'top' ? 'bottom-8' : 'top-8'} bg-base-100 border border-base-300 rounded-lg shadow-xl py-1 min-w-[140px] z-50`}>
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
              <div className="mt-1 md:mt-2 space-y-1 md:space-y-2">
                {message.attachments.map((a, idx) => (
                  a.contentType?.startsWith('image/') ? (
                    <div key={idx} className="relative group/attachment">
                      {/* Skeleton loader */}
                      {attachmentLoadingStates[idx] !== false && (
                        <div className="skeleton w-full max-w-[200px] md:max-w-sm h-40 md:h-64 rounded-lg"></div>
                      )}
                      
                      <img
                        src={a.url}
                        alt={a.filename || 'image'}
                        className={`rounded-lg max-w-[200px] md:max-w-sm max-h-48 md:max-h-80 w-full object-contain cursor-pointer hover:opacity-90 transition-opacity ${
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
                                
                                // Check positioning before opening
                                if (messageRef.current && imageMenuOpen !== `attachment-${idx}`) {
                                  const rect = messageRef.current.getBoundingClientRect();
                                  const viewportHeight = window.innerHeight;
                                  const spaceBelow = viewportHeight - rect.bottom;
                                  
                                  if (spaceBelow < 200) {
                                    setDropdownPosition('top');
                                  } else {
                                    setDropdownPosition('bottom');
                                  }
                                }
                                
                                setImageMenuOpen(imageMenuOpen === `attachment-${idx}` ? null : `attachment-${idx}`);
                              }}
                              className="btn btn-circle btn-xs bg-black/50 hover:bg-black/70 text-white border-none"
                            >
                              <MoreVertical className="w-3 h-3" />
                            </button>
                            
                            {imageMenuOpen === `attachment-${idx}` && (
                              <div className={`absolute right-0 ${dropdownPosition === 'top' ? 'bottom-8' : 'top-8'} bg-base-100 border border-base-300 rounded-lg shadow-xl py-1 min-w-[140px] z-50`}>
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
                  ) : (() => {
                    // Get file type info
                    const fileInfo = getFileTypeInfo(a.contentType, a.filename);
                    const FileIcon = fileInfo.icon;
                    
                    // Video files - show video player
                    if (a.contentType?.startsWith('video/')) {
                      return (
                        <div key={idx} className="rounded-lg overflow-hidden max-w-sm">
                          <video
                            src={a.url}
                            controls
                            className="w-full max-h-64 bg-black"
                            preload="metadata"
                          >
                            Your browser does not support video playback.
                          </video>
                          <div className={`p-2 flex items-center justify-between text-xs ${
                            isOwnMessage ? 'bg-primary-content/20' : 'bg-base-200'
                          }`}>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileIcon className={`w-4 h-4 flex-shrink-0 ${fileInfo.color}`} />
                              <span className="truncate">{a.filename || 'Video'}</span>
                              {a.size && <span className="text-xs opacity-60">{formatFileSize(a.size)}</span>}
                            </div>
                            <a
                              href={a.url}
                              download={a.filename || 'video'}
                              className="btn btn-xs btn-ghost ml-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      );
                    }
                    
                    // Audio files - show audio player
                    if (a.contentType?.startsWith('audio/')) {
                      return (
                        <div key={idx} className={`rounded-lg overflow-hidden max-w-sm ${
                          isOwnMessage ? 'bg-primary-content/20' : 'bg-base-200'
                        }`}>
                          <div className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <FileIcon className={`w-5 h-5 flex-shrink-0 ${fileInfo.color}`} />
                              <div className="min-w-0 flex-1">
                                <div className={`text-sm font-medium truncate ${
                                  isOwnMessage ? 'text-primary-content' : 'text-base-content'
                                }`}>
                                  {a.filename || 'Audio'}
                                </div>
                                {a.size && (
                                  <div className={`text-xs ${
                                    isOwnMessage ? 'text-primary-content/60' : 'text-base-content/60'
                                  }`}>
                                    {formatFileSize(a.size)}
                                  </div>
                                )}
                              </div>
                            </div>
                            <audio
                              src={a.url}
                              controls
                              className="w-full"
                              preload="metadata"
                            >
                              Your browser does not support audio playback.
                            </audio>
                          </div>
                          <div className={`px-3 pb-2 flex justify-end ${
                            isOwnMessage ? 'bg-primary-content/10' : 'bg-base-300/30'
                          }`}>
                            <a
                              href={a.url}
                              download={a.filename || 'audio'}
                              className="btn btn-xs btn-ghost"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    }
                    
                    // PDF and other documents
                    return (
                      <div key={idx} className={`rounded-lg p-3 max-w-sm border ${
                        isOwnMessage 
                          ? 'bg-primary-content/20 border-primary-content/40' 
                          : 'bg-base-200/50 border-base-300/50'
                      }`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            isOwnMessage ? 'bg-primary-content/30' : 'bg-base-300/50'
                          }`}>
                            <FileIcon className={`w-6 h-6 ${fileInfo.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm font-medium truncate mb-1 ${
                              isOwnMessage ? 'text-primary-content' : 'text-base-content'
                            }`}>
                              {a.filename || fileInfo.label}
                            </div>
                            <div className={`text-xs mb-2 ${
                              isOwnMessage ? 'text-primary-content/60' : 'text-base-content/60'
                            }`}>
                              <span className="font-medium">{fileInfo.label}</span>
                              {a.size && <span className="ml-2">{formatFileSize(a.size)}</span>}
                            </div>
                            <div className="flex gap-2">
                              {fileInfo.canPreview && (
                                <button
                                  className={`btn btn-xs ${
                                    isOwnMessage 
                                      ? 'bg-primary-content/30 hover:bg-primary-content/40 text-primary-content border-primary-content/40' 
                                      : 'btn-ghost'
                                  }`}
                                  onClick={() => window.open(a.url, '_blank')}
                                >
                                  <Maximize2 className="w-3 h-3 mr-1" />
                                  View
                                </button>
                              )}
                              <a
                                href={a.url}
                                download={a.filename || 'file'}
                                className={`btn btn-xs ${
                                  isOwnMessage 
                                    ? 'bg-primary-content/30 hover:bg-primary-content/40 text-primary-content border-primary-content/40' 
                                    : 'btn-ghost'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ))}
              </div>
            )}
            {/* Audio */}
            {message.audio?.url && (
              <div className="mt-1 md:mt-2 max-w-[200px] md:max-w-sm">
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

            {/* Emoji Reactions Display */}
            {reactions && reactions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-base-300/20">
                {Object.entries(getGroupedReactions()).map(([emoji, reacts]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactToMessage(emoji)}
                    className={`px-1.5 py-0.5 rounded-full text-sm flex items-center gap-0.5 transition-colors ${
                      userHasReacted(emoji)
                        ? isOwnMessage
                          ? 'bg-primary-content/30 hover:bg-primary-content/40'
                          : 'bg-base-300/50 hover:bg-base-300/70'
                        : isOwnMessage
                          ? 'bg-primary-content/10 hover:bg-primary-content/20'
                          : 'bg-base-200 hover:bg-base-300/50'
                    }`}
                    title={`Reacted by: ${reacts.map(r => {
                      const userId = typeof r.userId === 'object' ? r.userId._id : r.userId;
                      return userId === authUser?._id ? 'You' : (typeof r.userId === 'object' ? r.userId.fullName : 'User');
                    }).join(', ')}`}
                    disabled={isReactingToMessage}
                  >
                    <span>{emoji}</span>
                    {reacts.length > 1 && <span className="text-xs font-medium">{reacts.length}</span>}
                  </button>
                ))}
                {/* Add reaction button - opens the wider emoji picker */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEmojiPicker(!showEmojiPicker);
                  }}
                  className={`px-1.5 py-0.5 rounded-full text-sm transition-colors ${
                    showEmojiPicker
                      ? 'bg-primary text-primary-content'
                      : isOwnMessage
                        ? 'bg-primary-content/10 hover:bg-primary-content/20 text-primary-content/60'
                        : 'bg-base-200 hover:bg-base-300 text-base-content/60'
                  }`}
                  title="Add reaction"
                  disabled={isReactingToMessage}
                >
                  <Smile className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
          
          {/* Floating action buttons on hover - positioned above message bubble */}
          <div className={`absolute -top-8 ${isOwnMessage ? 'right-0' : 'left-0'} hidden md:flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-base-100 border border-base-300 rounded-lg shadow-lg p-1 z-20`}>
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
        </div>

        {/* Avatar for sent messages is not shown */}
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