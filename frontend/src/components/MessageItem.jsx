import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { AlertCircle, RotateCcw, Edit, Trash2, Quote, FileText, Play, Pause, Volume2, MoreVertical, Phone, Video } from "lucide-react";
import useLongPress from "../hooks/useLongPress";
import Avatar from "./Avatar";

const MessageItem = ({ message, onEdit, onDelete, onQuote, selectedUser, selectedGroup, groupPosition, isUnread }) => {
  const { authUser } = useAuthStore();
  const { sendMessage } = useChatStore();

  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const messageRef = useRef(null);
  const dropdownRef = useRef(null);

  const senderId = typeof message.senderId === 'object' && message.senderId ? message.senderId._id : message.senderId;
  const senderObj = typeof message.senderId === 'object' && message.senderId ? message.senderId : null;
  const isOwnMessage = senderId === authUser?._id;

  // Get sender info
  const getSenderInfo = () => {
    if (isOwnMessage) return { name: 'You', avatar: authUser?.profilePic };
    if (senderObj) return { name: senderObj.fullName, avatar: senderObj.profilePic };
    if (selectedUser) return { name: selectedUser.fullName, avatar: selectedUser.profilePic };
    if (selectedGroup && Array.isArray(selectedGroup.members)) {
      const member = selectedGroup.members.find(m => m._id === senderId);
      if (member) {
        return { name: member.fullName, avatar: member.profilePic };
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

  // VoiceMessagePlayer component
  const VoiceMessagePlayer = ({ audioUrl, isOwnMessage }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const audioRef = useRef(null);

    // Fixed waveform bar heights for consistent appearance
    const waveformBars = [6, 12, 8, 14, 10, 16, 8, 12];

    useEffect(() => {
      const audio = audioRef.current;
      if (audio) {

        const handleLoadedMetadata = () => {
          setDuration(audio.duration || 0);
          setIsLoading(false);
        };

        const handleTimeUpdate = () => {
          setCurrentTime(audio.currentTime || 0);
        };

        const handlePlay = () => {
          setIsPlaying(true);
        };

        const handlePause = () => {
          setIsPlaying(false);
        };

        const handleEnded = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };

        const handleLoadStart = () => {
          setIsLoading(true);
        };

        const handleCanPlay = () => {
          setIsLoading(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadstart', handleLoadStart);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
          audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audio.removeEventListener('timeupdate', handleTimeUpdate);
          audio.removeEventListener('play', handlePlay);
          audio.removeEventListener('pause', handlePause);
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('loadstart', handleLoadStart);
          audio.removeEventListener('canplay', handleCanPlay);
        };
      }
    }, [audioUrl]);

    const togglePlayPause = async () => {
      const audio = audioRef.current;

      if (audio) {
        try {
          if (isPlaying) {
            audio.pause();
          } else {
            await audio.play();
          }
        } catch (error) {
          console.error('Audio playback error:', error);
          setIsPlaying(false);
        }
      }
    };

    const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg max-w-sm w-full sm:max-w-xs ${isOwnMessage
        ? 'bg-primary/10 border border-primary/20'
        : 'bg-base-300/30 border border-base-300/50'
        }`}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`btn btn-circle flex-shrink-0 min-h-[44px] w-11 h-11 sm:w-10 sm:h-10 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
            } ${isOwnMessage
              ? 'bg-primary hover:bg-primary/80 text-primary-content'
              : 'bg-base-content/10 hover:bg-base-content/20 text-base-content'
            }`}
        >
          {isLoading ? (
            <div className="loading loading-spinner loading-xs" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4 ml-0.5" />
          )}
        </button>

        {/* Progress Bar and Waveform */}
        <div className="flex-1 flex items-center gap-2">
          {/* Animated Waveform Bars */}
          <div className="flex items-center gap-0.5 flex-1">
            {waveformBars.map((height, i) => (
              <div
                key={i}
                className={`w-0.5 bg-current rounded-full transition-all duration-300 ${isOwnMessage ? 'text-primary/60' : 'text-base-content/40'
                  } ${isPlaying ? 'animate-pulse' : ''}`}
                style={{
                  height: `${height}px`,
                  animationDelay: `${i * 100}ms`
                }}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="w-12 bg-base-300/50 rounded-full h-1 relative overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-200 ${isOwnMessage ? 'bg-primary' : 'bg-base-content/60'
                }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Time Display */}
          <div className={`text-xs font-mono min-w-[40px] text-center sm:min-w-[35px] ${isOwnMessage ? 'text-primary-content/70' : 'text-base-content/60'
            }`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Audio Icon */}
        <div className={`flex-shrink-0 ${isOwnMessage ? 'text-primary-content/70' : 'text-base-content/60'
          }`}>
          <Volume2 className="w-4 h-4" />
        </div>

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          className="hidden"
          controls={false}
          crossOrigin="anonymous"
        />
      </div>
    );
  };

  return (
    <div
      className={`px-4 py-1 ${showAvatar ? 'mt-2' : 'mt-0.5'} group relative message-item`}
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
          className={`max-w-[70%] min-w-[100px] rounded-lg px-3 py-2 pr-9 relative group ${isOwnMessage
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
              <div className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-7 bg-base-100 border border-base-300 rounded-md shadow-lg py-1 min-w-[110px] z-50`}>
                {/* Quote option - available for all messages */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(false);
                    onQuote?.(message);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-base-200 flex items-center gap-2 text-base-content transition-colors"
                >
                  <Quote className="w-3.5 h-3.5" />
                  <span>Quote</span>
                </button>

                {/* Edit option - only for own messages with text */}
                {isOwnMessage && message.text && (
                  <button
                    onClick={handleEditClick}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-base-200 flex items-center gap-2 text-base-content transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}

                {/* Delete option - only for own messages */}
                {isOwnMessage && (
                  <button
                    onClick={handleDeleteClick}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-error/10 flex items-center gap-2 text-error transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
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
              const qSenderId = typeof q.senderId === 'object' ? q.senderId._id : q.senderId;
              let qName = 'Unknown';
              if (qSenderId === authUser?._id) qName = 'You';
              else if (selectedUser && selectedUser._id === qSenderId) qName = selectedUser.fullName;
              else if (selectedGroup && Array.isArray(selectedGroup.members)) {
                const m = selectedGroup.members.find(m => m._id === qSenderId);
                if (m) qName = m.fullName;
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
                        <span>{textWithoutIcon}</span>
                      </div>
                    );
                  }
                  return message.text;
                })()}
              </div>
            )}

            {/* Message image */}
            {message.image && (
              <div className="mt-2">
                <img
                  src={message.image}
                  alt="Message attachment"
                  className="rounded-lg max-w-sm max-h-80 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                />
              </div>
            )}
            {/* Attachments */}
            {Array.isArray(message.attachments) && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((a, idx) => (
                  a.contentType?.startsWith('image/') ? (
                    <img
                      key={idx}
                      src={a.url}
                      alt={a.filename || 'image'}
                      className="rounded-lg max-w-sm max-h-80 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ) : a.contentType === 'application/pdf' ? (
                    <div key={idx} className="bg-base-200/50 border border-base-300/50 rounded-lg p-3 flex items-center justify-between max-w-sm">
                      <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                        <span className="truncate text-base-content/80">{a.filename || 'PDF'}</span>
                      </div>
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => setDocPreview({ url: a.url, filename: a.filename || 'Document' })}
                        >
                          View
                        </button>
                        <a target="_blank" rel="noreferrer" className="btn btn-xs btn-primary" href={a.url}>
                          Open
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="bg-base-200/50 border border-base-300/50 rounded-lg p-3 flex items-center justify-between max-w-sm">
                      <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                        <span className="truncate text-base-content/80">{a.filename || a.contentType || 'File'}</span>
                      </div>
                      <a target="_blank" rel="noreferrer" className="btn btn-xs btn-primary ml-2 flex-shrink-0" href={a.url}>
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
                <VoiceMessagePlayer
                  audioUrl={message.audio.url}
                  isOwnMessage={isOwnMessage}
                />
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

        {/* Avatar for sent messages (optional, usually not shown) */}
        {isOwnMessage && showAvatar && false && (
          <div className="flex-shrink-0 mb-1">
            <Avatar
              src={senderInfo.avatar}
              name={senderInfo.name}
              size="w-8 h-8"
              className="rounded-full"
            />
          </div>
        )}
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
        <div className="dropdown dropdown-open absolute top-0 right-0 mt-[-45px] z-10">
          <div className="dropdown-content menu bg-base-100 text-base-content rounded-xl shadow-lg border border-base-200 w-52">
            {isOwnMessage && message.status !== 'failed' && (
              <li>
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2"
                  title="Edit message"
                >
                  <Edit size={16} />
                  Edit
                </button>
              </li>
            )}
            <li>
              <button
                onClick={(e) => { e.stopPropagation(); setShowContextMenu(false); onQuote?.(message); }}
                className="flex items-center gap-2"
                title="Quote message"
              >
                <Quote size={16} />
                Quote
              </button>
            </li>
            {isOwnMessage && (
              <li>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-2 text-error hover:bg-error/10"
                  title="Delete message"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </li>
            )}
          </div>
        </div>
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
    </div>
  );
};

export default MessageItem;