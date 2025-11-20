import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "../store/useChatStore";
import { SendIcon, XIcon, Smile, Paperclip, Mic, StopCircle, Sparkles } from "lucide-react";
import AttachmentTypeModal from "./AttachmentTypeModal";
import EmojiPickerModal from "./EmojiPickerModal";
import CaptionImageModal from "./CaptionImageModal";
import FormattingToolbar from "./FormattingToolbar";
import WYSIWYGMessageInput from "./WYSIWYGMessageInput";
import { useWYSIWYGEditor } from "../hooks/useWYSIWYGEditor";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import useFriendStore from "../store/useFriendStore";
import { generateCaptionImage } from "../utils/captionImageGenerator";
import MentionDropdown from "./mentions/MentionDropdown";
import { hapticSuccess } from "../utils/haptic";
import {
  getVoiceRecordingConstraints,
  getBestAudioMimeType,
  processAudioBlob,
  getMicrophoneErrorMessage,
  supportsAdvancedAudioProcessing
} from "../utils/audioProcessor";

const MessageInput = ({ onInputFocus, onLocalTypingChange }) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [attachments, setAttachments] = useState([]); // {url, storageKey, contentType, filename, size}
  const [audio, setAudio] = useState(null); // {url, storageKey, contentType, durationSec}
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [recordStartTs, setRecordStartTs] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioStream, setAudioStream] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [localTypingUsers, setLocalTypingUsers] = useState([]); // eslint-disable-line no-unused-vars
  const { sendMessage, selectedUser, selectedGroup, messageInputText, setMessageInputText, quotedMessage, clearQuotedMessage, messages, playKeystrokeSound } = useChatStore();
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [showCaptionImageModal, setShowCaptionImageModal] = useState(false);
  const [showAttachmentTypeModal, setShowAttachmentTypeModal] = useState(false);
  const emojiBtnRef = useRef(null);
  const fileInputRef = useRef(null);
  const { authUser } = useAuthStore();
  const friendStore = useFriendStore();

  // Smart Mentions State
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionTriggerType, setMentionTriggerType] = useState('user');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentions, setMentions] = useState([]); // Track mentions in message
  const inputRef = useRef(null);

  // Formatting State
  const [isFormattingExpanded, setIsFormattingExpanded] = useState(false);

  // WYSIWYG Editor
  const {
    commandsRef,
    activeFormats,
    applyFormat,
    clearEditor,
    getPlainText,
    getHtml,
    handleFormatChange,
  } = useWYSIWYGEditor();

  // Keyboard handling state removed - using sticky positioning instead

  // Check message limit for non-friends - memoized to prevent recalculation on every render
  const limitInfo = useMemo(() => {
    if (!selectedUser || selectedGroup) return { isLimited: false, messagesSent: 0, remaining: 3 };

    const st = friendStore.statusByUser[selectedUser._id] || {};
    const isFriend = (friendStore.requests?.friends || []).some(f => f._id === selectedUser._id) || st.status === 'friends';

    if (isFriend) return { isLimited: false, messagesSent: 0, remaining: 3 };

    const messagesSentByMe = messages.filter(msg => {
      const senderId = typeof msg.senderId === 'object' ? msg.senderId._id : msg.senderId;
      return senderId === authUser?._id;
    }).length;

    return {
      isLimited: messagesSentByMe >= 3,
      messagesSent: messagesSentByMe,
      remaining: Math.max(0, 3 - messagesSentByMe)
    };
  }, [selectedUser, selectedGroup, messages, authUser, friendStore.statusByUser, friendStore.requests]);

  // Use IDs to prevent unnecessary re-renders
  const selectedUserId = selectedUser?._id;
  const selectedGroupId = selectedGroup?._id;

  // Keyboard handling removed - using sticky positioning and dvh units instead

  // Update recording duration
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordStartTs) / 1000));
      }, 100);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordStartTs]);

  // Cleanup audio stream, typing, and recording indicators on unmount
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }

      // Clear typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      const { socket } = useAuthStore.getState();
      if (socket && socket.connected) {
        const conversationId = selectedUser?._id || selectedGroup?._id;
        const isGroup = !!selectedGroup;

        if (conversationId) {
          // Stop typing indicator if active
          if (isTyping) {
            socket.emit('stopTyping', {
              conversationId,
              isGroup
            });
          }

          // Stop recording indicator if active
          if (isRecording) {
            socket.emit('stopRecording', {
              conversationId,
              isGroup
            });
          }
        }
      }
    };
  }, [audioStream, typingTimeout, isTyping, isRecording, selectedUser, selectedGroup]);

  // Close emoji picker on mount and when switching chats
  useEffect(() => { setIsEmojiOpen(false); }, []);
  useEffect(() => { setIsEmojiOpen(false); }, [selectedUserId, selectedGroupId]);

  // Update local text state when store text changes (from templates)
  useEffect(() => {
    if (messageInputText) {
      setText(messageInputText);
      setMessageInputText(""); // Clear the store text after setting
    }
  }, [messageInputText, setMessageInputText]);

  // Detect @ or # trigger for mentions
  const detectMention = (text, cursorPos) => {
    // Look backwards from cursor to find @ or #
    let i = cursorPos - 1;
    while (i >= 0 && text[i] !== ' ' && text[i] !== '\n') {
      if (text[i] === '@') {
        const query = text.substring(i + 1, cursorPos);
        return { trigger: '@', startIndex: i, query, type: 'user' };
      }
      if (text[i] === '#') {
        const query = text.substring(i + 1, cursorPos);
        return { trigger: '#', startIndex: i, query, type: 'group' };
      }
      i--;
    }
    return null;
  };

  // Calculate dropdown position - above input area, within chat interface
  const calculateMentionPosition = () => {
    const input = inputRef.current;
    if (!input) return { top: 0, left: 0 };

    const rect = input.getBoundingClientRect();
    const dropdownHeight = 320;
    const dropdownWidth = 280;

    // Calculate position above input
    let top = rect.top - dropdownHeight - 8;
    let left = rect.left;

    // Ensure dropdown stays within viewport
    const viewportWidth = window.innerWidth;

    // Adjust horizontal position if needed
    if (left + dropdownWidth > viewportWidth - 20) {
      left = viewportWidth - dropdownWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }

    // Adjust vertical position if needed
    if (top < 20) {
      // If not enough space above, position below input instead
      top = rect.bottom + 8;
    }

    return { top, left };
  };

  // Handle text change with mention detection and typing indicator
  const handleTextChange = (newText) => {
    if (newText.length <= 2000) {
      setText(newText);

      // Detect mention trigger
      const cursorPos = inputRef.current?.selectionStart || newText.length;
      const mention = detectMention(newText, cursorPos);

      if (mention) {
        setShowMentionDropdown(true);
        setMentionQuery(mention.query);
        setMentionStartIndex(mention.startIndex);
        setMentionTriggerType(mention.type);
        setMentionPosition(calculateMentionPosition());
      } else {
        setShowMentionDropdown(false);
        setMentionQuery('');
        setMentionStartIndex(-1);
      }

      // TYPING SYSTEM: Emit typing event on every keystroke
      const { socket } = useAuthStore.getState();
      if (socket && socket.connected) {
        const conversationId = selectedUser?._id || selectedGroup?._id;
        const isGroup = !!selectedGroup;

        if (conversationId) {
          // Always emit typing event to keep indicator alive on receiver's side
          socket.emit('typing', {
            conversationId,
            isGroup,
            userName: authUser?.fullName
          });

          // Set typing state if not already set
          if (!isTyping) {
            setIsTyping(true);
            // Add yourself to local typing users for immediate feedback
            const newLocalUsers = [authUser?.fullName || 'You'];
            setLocalTypingUsers(newLocalUsers);
            onLocalTypingChange?.(newLocalUsers);
          }

          // Clear previous inactivity timeout
          if (typingTimeout) {
            clearTimeout(typingTimeout);
          }

          // Set new 3-second inactivity timeout
          const timeout = setTimeout(() => {
            socket.emit('stopTyping', {
              conversationId,
              isGroup
            });
            setIsTyping(false);
            setLocalTypingUsers([]);
            onLocalTypingChange?.([]);
          }, 3000);

          setTypingTimeout(timeout);
        }
      }
    }
  };

  // Handle format toggle (activates/deactivates formatting mode)
  const handleFormatToggle = (formatType) => {
    applyFormat(formatType);
  };

  // Handle text formatting with keyboard shortcuts


  // Handle mention selection
  const handleMentionSelect = (item) => {
    const input = inputRef.current;
    if (!input || mentionStartIndex === -1) return;

    const beforeMention = text.substring(0, mentionStartIndex);
    const afterMention = text.substring(input.selectionStart);

    // Format mention based on type
    const mentionText = mentionTriggerType === 'user'
      ? `@${item.username || item.fullName}`
      : `#${item.name}`;

    const newText = beforeMention + mentionText + ' ' + afterMention;
    setText(newText);

    // Track mention with full details
    setMentions(prev => {
      // Remove any existing mention at this position
      const filtered = prev.filter(m => m.position !== mentionStartIndex);

      return [...filtered, {
        type: mentionTriggerType,
        id: item._id || item.id,
        name: item.fullName || item.name,
        username: item.username,
        position: mentionStartIndex,
        validated: true // Mark as validated since it was selected from dropdown
      }];
    });

    // Close dropdown
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(-1);

    // Set cursor after mention
    setTimeout(() => {
      const newCursorPos = mentionStartIndex + mentionText.length + 1;
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMentionDropdown && inputRef.current && !inputRef.current.contains(e.target)) {
        setShowMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentionDropdown]);

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setImage(file);
          const reader = new FileReader();
          reader.onload = (e) => setPreviewImage(e.target.result);
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const handleCaptionImageGenerate = async (options) => {
    try {
      const blob = await generateCaptionImage(options);
      const file = new File([blob], `caption-${Date.now()}.png`, { type: 'image/png' });
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
      setText(options.text); // Set caption as message text
      setShowCaptionImageModal(false);
    } catch (error) {
      console.error('Failed to generate caption image:', error);
      alert('Failed to generate image. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !image && attachments.length === 0 && !audio) || isSending) return;

    setIsSending(true);

    // Haptic feedback on send
    hapticSuccess();

    // Stop typing when sending message
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    const { socket } = useAuthStore.getState();
    if (socket && socket.connected && isTyping) {
      const conversationId = selectedUser?._id || selectedGroup?._id;
      const isGroup = !!selectedGroup;

      if (conversationId) {
        socket.emit('stopTyping', {
          conversationId,
          isGroup
        });
        setIsTyping(false);
        setLocalTypingUsers([]);
        onLocalTypingChange?.([]);
      }
    }

    try {
      // Validate mentions before sending
      const validatedMentions = await validateMentionsBeforeSend(text, mentions);

      let imageData = null;
      if (image) {
        try {
          // Silently compress and convert image to base64
          const { compressImageToBase64 } = await import('../utils/imageCompression');
          imageData = await compressImageToBase64(image);
        } catch (imgError) {
          console.error('Failed to process image:', imgError);
          alert('Failed to process image. Please try again.');
          setIsSending(false);
          return;
        }
      }

      // Get HTML for formatted text
      const htmlContent = getHtml();

      await sendMessage({
        text,
        html: htmlContent, // Add HTML for rich formatting
        image: imageData,
        attachments,
        audio,
        mentions: validatedMentions
      });
      
      // Clear form on success
      setText("");
      clearEditor();
      setImage(null);
      setPreviewImage(null);
      setAttachments([]);
      setAudio(null);
      setMentions([]);
      clearQuotedMessage(); // Clear quote after sending

      // Keep input focused after sending so user can continue typing
      setTimeout(() => {
        if (commandsRef.current) {
          commandsRef.current.focus();
        }
      }, 0);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to send message';
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsSending(false);
    }
  };

  // Validate mentions before sending
  const validateMentionsBeforeSend = async (messageText, mentionsList) => {
    if (!messageText || mentionsList.length === 0) return mentionsList;

    try {
      // Extract all @mentions and #groups from text
      const mentionPattern = /(@everyone|@here|@[\w.-]+|#[\w\s-]+)/g;
      const foundMentions = [];
      let match;

      while ((match = mentionPattern.exec(messageText)) !== null) {
        const matchText = match[0];
        let type = 'user';
        let name = matchText.substring(1);

        if (matchText.startsWith('#')) {
          type = 'group';
        } else if (matchText === '@everyone') {
          type = 'everyone';
          name = 'everyone';
        } else if (matchText === '@here') {
          type = 'here';
          name = 'here';
        }

        foundMentions.push({ type, name, text: matchText });
      }

      // Validate each mention against the tracked mentions list
      const validMentions = mentionsList.filter(mention => {
        return foundMentions.some(found =>
          found.type === mention.type &&
          (found.name === mention.name || found.name === mention.username)
        );
      });

      return validMentions;
    } catch (error) {
      console.error('Error validating mentions:', error);
      return mentionsList;
    }
  };

  // Determine placeholder text
  const getPlaceholder = () => {
    if (limitInfo.isLimited) {
      return "Send a friend request to continue chatting";
    }
    if (limitInfo.remaining <= 1 && limitInfo.remaining > 0) {
      return `${limitInfo.remaining} message left before friend request needed`;
    }
    if (selectedUser) return `Message ${selectedUser?.fullName || ""}`;
    if (selectedGroup) return `Message ${selectedGroup?.name || "group"}`;
    return "Type a message...";
  };

  return (
    <div
      className="message-input-container px-4 md:px-6 py-3 bg-base-100 border-t border-base-300 sticky bottom-0 z-20"
      data-tutorial="message-input"
      style={{
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
      }}
    >
      {/* IMAGE PREVIEW */}
      {previewImage && (
        <div className="relative mb-2 w-fit">
          <img src={previewImage} alt="Preview" className="rounded-lg h-24 object-cover" />
          <button
            onClick={() => {
              setPreviewImage(null);
              setImage(null);
            }}
            className="btn btn-xs btn-error btn-circle absolute -top-2 -right-2"
            disabled={isSending}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* ATTACHMENTS PREVIEW */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((a, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-base-200 rounded-lg px-2 py-1 text-xs">
              {a.contentType?.startsWith('image/') ? (
                <img src={a.url} className="w-8 h-8 object-cover rounded" alt={a.filename || 'image'} />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span className="max-w-[120px] truncate">{a.filename || a.contentType}</span>
              <button className="btn btn-ghost btn-xs" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}><XIcon className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* AUDIO PREVIEW */}
      {audio && (
        <div className="flex items-center gap-2 mb-2 bg-base-200 rounded-lg px-3 py-2">
          <Mic className="w-5 h-5 text-primary" />
          <div className="flex-1">
            <audio src={audio.url} controls className="w-full h-8" />
          </div>
          <button className="btn btn-ghost btn-xs" onClick={() => setAudio(null)}><XIcon className="w-4 h-4" /></button>
        </div>
      )}

      {/* RECORDING INDICATOR */}
      {isRecording && (
        <div className="flex items-center gap-3 mb-2 bg-error/10 border border-error/30 rounded-lg px-3 py-2">
          <div className="relative">
            <Mic className="w-5 h-5 text-error" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
            </span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-error">Recording...</div>
            <div className="text-xs text-base-content/60">{Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, '0')}</div>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-error rounded-full animate-pulse"
                style={{
                  height: `${12 + Math.random() * 12}px`,
                  animationDelay: `${i * 100}ms`,
                  animationDuration: '0.8s'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* PROCESSING INDICATOR */}
      {isProcessingAudio && (
        <div className="flex items-center gap-3 mb-2 bg-primary/10 border border-primary/30 rounded-lg px-3 py-2">
          <span className="loading loading-spinner loading-sm text-primary"></span>
          <div className="text-sm font-medium text-primary">Processing audio...</div>
        </div>
      )}

      {/* QUOTE PREVIEW */}
      {quotedMessage && (
        <div className="flex items-center justify-between bg-base-200 border border-base-300 rounded-lg px-3 py-2 mb-2">
          <div className="text-sm opacity-80 truncate">
            <span className="font-medium mr-1">Quoted:</span>
            {quotedMessage.text}
          </div>
          <button className="btn btn-ghost btn-xs" type="button" onClick={clearQuotedMessage}>
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MESSAGE LIMIT WARNING */}
      {selectedUser && !selectedGroup && limitInfo.messagesSent > 0 && !limitInfo.isLimited && (
        <div className="alert alert-warning mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            {limitInfo.remaining === 1 ? (
              <span>You can send <strong>1 more message</strong> to {selectedUser.fullName}. Send a friend request to continue chatting.</span>
            ) : (
              <span>You can send <strong>{limitInfo.remaining} more messages</strong> to {selectedUser.fullName} before needing to send a friend request.</span>
            )}
          </div>
        </div>
      )}

      {/* MESSAGE LIMIT REACHED */}
      {limitInfo.isLimited && (
        <div className="alert alert-error mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span>You've reached the <strong>3-message limit</strong> with {selectedUser?.fullName}. Send a friend request to continue chatting.</span>
          </div>
        </div>
      )}

      {/* MENTION PREVIEW - Show validated mentions */}
      {mentions.length > 0 && text.trim() && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-base-200 rounded-lg border border-base-300">
          <span className="text-xs text-base-content/60 font-medium">Mentioning:</span>
          {mentions.map((mention, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-base-content border border-primary/20"
            >
              {mention.type === 'user' ? '@' : '#'}
              {mention.username || mention.name}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* HIDDEN FILE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          disabled={isSending || limitInfo.isLimited}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            
            // File size limits (in bytes)
            const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
            const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB for other files

            for (const f of files) {
              try {
                // Check file size
                const maxSize = f.type.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
                if (f.size > maxSize) {
                  const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
                  alert(`File "${f.name}" is too large. Maximum size is ${sizeMB}MB.`);
                  continue;
                }

                // Check if it's an image
                if (f.type.startsWith('image/')) {
                  // Handle as image
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setPreviewImage(reader.result);
                    setImage(f);
                  };
                  reader.onerror = () => {
                    console.error('Failed to read image file:', f.name);
                    alert(`Failed to read "${f.name}". Please try again.`);
                  };
                  reader.readAsDataURL(f);
                } else {
                  // Handle as attachment - convert to base64
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    try {
                      const base64 = reader.result;
                      const res = await axiosInstance.post('/api/messages/upload-attachment', { 
                        base64, 
                        filename: f.name 
                      });
                      setAttachments(prev => [...prev, res.data]);
                    } catch (err) {
                      console.error('Failed to upload attachment:', err);
                      const errorMsg = err.response?.data?.message || 'Upload failed';
                      alert(`Failed to upload "${f.name}": ${errorMsg}`);
                    }
                  };
                  reader.onerror = () => {
                    console.error('Failed to read file:', f.name);
                    alert(`Failed to read "${f.name}". Please try again.`);
                  };
                  reader.readAsDataURL(f);
                }
              } catch (error) {
                console.error('Error processing file:', f.name, error);
                alert(`Error processing "${f.name}". Please try again.`);
              }
            }
            e.target.value = '';
          }}
        />

        {/* ATTACHMENT BUTTON */}
        <button
          type="button"
          className={`transition-colors ${isSending || limitInfo.isLimited ? 'text-base-content/50' : 'text-base-content/70 hover:text-primary'}`}
          onClick={() => setShowAttachmentTypeModal(true)}
          disabled={isSending || limitInfo.isLimited}
          title="Attach file"
          data-tutorial="attach-button"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* CAPTION IMAGE */}
        <button
          type="button"
          className={`transition-colors ${isSending || limitInfo.isLimited ? 'text-base-content/50' : 'text-base-content/70 hover:text-primary'}`}
          onClick={() => setShowCaptionImageModal(true)}
          disabled={isSending || limitInfo.isLimited}
          title="Create Caption Image"
        >
          <Sparkles className="h-5 w-5" />
        </button>

        {/* TEXT INPUT WITH AUDIO BUTTON INSIDE */}
        <div className="flex-1 relative">
          <WYSIWYGMessageInput
            onChange={(newText) => {
              setText(newText);
              handleTextChange(newText);
            }}
            onEnter={() => {
              const messageText = getPlainText();
              if (messageText.trim()) {
                handleSubmit(new Event('submit'));
              }
            }}
            onFormatChange={handleFormatChange}
            onFocus={() => onInputFocus?.()}
            onBlur={() => {
              // Stop typing when leaving input area
              if (isTyping) {
                const { socket } = useAuthStore.getState();
                if (socket && socket.connected) {
                  const conversationId = selectedUser?._id || selectedGroup?._id;
                  const isGroup = !!selectedGroup;

                  if (conversationId) {
                    socket.emit('stopTyping', {
                      conversationId,
                      isGroup
                    });
                    setIsTyping(false);
                    setLocalTypingUsers([]);
                    onLocalTypingChange?.([]);
                  }
                }

                // Clear timeout
                if (typingTimeout) {
                  clearTimeout(typingTimeout);
                  setTypingTimeout(null);
                }
              }
            }}
            placeholder={getPlaceholder()}
            disabled={isSending || limitInfo.isLimited}
            maxLength={2000}
            commandsRef={commandsRef}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              // Play keystroke sound for actual typing
              if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                playKeystrokeSound();
              }

              // Close mention dropdown on Escape
              if (e.key === 'Escape' && showMentionDropdown) {
                e.preventDefault();
                setShowMentionDropdown(false);
              }
            }}
          />

          {/* AUDIO RECORD BUTTON INSIDE TEXTAREA */}
          <button
            type="button"
            className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${isSending || limitInfo.isLimited ? 'text-base-content/50' : isRecording ? 'text-error' : 'text-base-content/70 hover:text-primary'}`}
            disabled={limitInfo.isLimited || isProcessingAudio}
            title={isRecording ? "Stop recording" : "Record audio"}
            onClick={async () => {
              if (isRecording) {
                // Stop recording
                setIsProcessingAudio(true);
                recorder?.stop();
                setIsRecording(false);

                // Emit stop recording event
                const { socket } = useAuthStore.getState();
                if (socket && socket.connected) {
                  const conversationId = selectedUser?._id || selectedGroup?._id;
                  const isGroup = !!selectedGroup;

                  if (conversationId) {
                    socket.emit('stopRecording', {
                      conversationId,
                      isGroup
                    });
                  }
                }
              } else {
                // Start recording with optimized settings for poor microphones
                try {
                  const constraints = getVoiceRecordingConstraints();
                  const stream = await navigator.mediaDevices.getUserMedia(constraints);

                  setAudioStream(stream);

                  // Create MediaRecorder with optimized settings for voice messages
                  const { mimeType, audioBitsPerSecond } = getBestAudioMimeType();
                  const mr = new MediaRecorder(stream, {
                    mimeType,
                    audioBitsPerSecond
                  });

                  const chunks = [];
                  mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                  mr.onstop = async () => {
                    setIsProcessingAudio(true);
                    try {
                      let blob = new Blob(chunks, { type: mimeType });
                      const durationSec = Math.round((Date.now() - recordStartTs) / 1000);

                      // Apply additional audio processing if supported
                      if (supportsAdvancedAudioProcessing() && durationSec > 1) {
                        try {
                          blob = await processAudioBlob(blob);
                          console.log('✅ Audio processing applied for better quality');
                        } catch (processingError) {
                          console.warn('Audio processing failed, using original:', processingError);
                        }
                      }

                      const reader = new FileReader();
                      reader.readAsDataURL(blob);
                      await new Promise((r) => (reader.onloadend = r));
                      const base64 = reader.result?.toString();

                      const res = await axiosInstance.post('/api/messages/upload-audio', { base64, durationSec });
                      setAudio(res.data);
                    } catch (error) {
                      console.error('Failed to process audio:', error);
                      alert('Failed to process audio recording. Please try again.');
                    } finally {
                      setIsProcessingAudio(false);
                      // Stop all tracks to release microphone
                      stream.getTracks().forEach(track => track.stop());
                      setAudioStream(null);
                    }
                  };

                  mr.start();
                  setRecorder(mr);
                  setRecordStartTs(Date.now());
                  setIsRecording(true);

                  // Emit recording event
                  const { socket } = useAuthStore.getState();
                  if (socket && socket.connected) {
                    const conversationId = selectedUser?._id || selectedGroup?._id;
                    const isGroup = !!selectedGroup;

                    if (conversationId) {
                      socket.emit('recording', {
                        conversationId,
                        isGroup,
                        userName: authUser?.fullName
                      });
                    }
                  }
                } catch (error) {
                  console.error('Failed to start recording:', error);
                  const userMessage = getMicrophoneErrorMessage(error);
                  alert(userMessage);

                  // Try with basic constraints if advanced ones fail
                  if (error.name === 'OverconstrainedError') {
                    try {
                      const basicStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                          echoCancellation: true,
                          noiseSuppression: true,
                          autoGainControl: true
                        }
                      });

                      setAudioStream(basicStream);
                      const { mimeType, audioBitsPerSecond } = getBestAudioMimeType();
                      const mr = new MediaRecorder(basicStream, { mimeType, audioBitsPerSecond });

                      const chunks = [];
                      mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                      mr.onstop = async () => {
                        setIsProcessingAudio(true);
                        try {
                          const blob = new Blob(chunks, { type: mimeType });
                          const durationSec = Math.round((Date.now() - recordStartTs) / 1000);
                          const reader = new FileReader();
                          reader.readAsDataURL(blob);
                          await new Promise((r) => (reader.onloadend = r));
                          const base64 = reader.result?.toString();

                          const res = await axiosInstance.post('/api/messages/upload-audio', { base64, durationSec });
                          setAudio(res.data);
                        } catch (error) {
                          console.error('Failed to process audio:', error);
                          alert('Failed to process audio recording. Please try again.');
                        } finally {
                          setIsProcessingAudio(false);
                          basicStream.getTracks().forEach(track => track.stop());
                          setAudioStream(null);
                        }
                      };

                      mr.start();
                      setRecorder(mr);
                      setRecordStartTs(Date.now());
                      setIsRecording(true);
                      console.log('✅ Recording started with basic constraints');
                    } catch (basicError) {
                      console.error('Failed with basic constraints too:', basicError);
                    }
                  }
                }
              }
            }}
          >
            {isProcessingAudio ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : isRecording ? (
              <>
                <StopCircle className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                </span>
              </>
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </button>

          {/* Formatting Toolbar - Inside textarea, much closer to microphone */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <FormattingToolbar
              isExpanded={isFormattingExpanded}
              onToggle={() => setIsFormattingExpanded(!isFormattingExpanded)}
              activeFormats={activeFormats}
              onFormatToggle={handleFormatToggle}
              disabled={isSending || limitInfo.isLimited}
            />
          </div>

          {/* Character count */}
          {text.length > 1800 && (
            <div className="absolute -top-6 right-0 text-xs text-base-content/60 bg-base-100 px-2 py-0.5 rounded">
              {text.length}/2000
            </div>
          )}
        </div>

        {/* EMOJI PICKER */}
        <button
          type="button"
          ref={emojiBtnRef}
          onClick={() => setIsEmojiOpen(v => !v)}
          disabled={limitInfo.isLimited}
          className={`transition-colors ${isSending || limitInfo.isLimited ? 'text-base-content/50' : 'text-base-content/70 hover:text-primary'}`}
          title="Add emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        {/* SEND BUTTON */}
        <button
          type="submit"
          disabled={(!text.trim() && !image && attachments.length === 0 && !audio) || isSending || limitInfo.isLimited}
          className={`btn btn-circle ${(!text.trim() && !image && attachments.length === 0 && !audio) || isSending || limitInfo.isLimited
            ? "btn-disabled"
            : "btn-primary"
            }`}
        >
          {isSending ? (
            // Show loading spinner when sending
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <SendIcon className="h-5 w-5" />
          )}
        </button>
      </form>

      {/* Emoji Picker Modal - keepMounted for faster reopen */}
      <EmojiPickerModal isOpen={isEmojiOpen} onClose={() => setIsEmojiOpen(false)} onSelectEmoji={(emoji) => setText(prev => (prev || "") + emoji)} triggerRef={emojiBtnRef} keepMounted={false} />

      {/* Attachment Type Modal */}
      <AttachmentTypeModal
        isOpen={showAttachmentTypeModal}
        onClose={() => setShowAttachmentTypeModal(false)}
        onSelectType={(type, accept) => {
          setShowAttachmentTypeModal(false);
          if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
          }
        }}
      />

      {/* Caption Image Modal */}
      {showCaptionImageModal && (
        <CaptionImageModal
          isOpen={showCaptionImageModal}
          onClose={() => setShowCaptionImageModal(false)}
          onGenerate={handleCaptionImageGenerate}
        />
      )}

      {/* Smart Mention Dropdown - Rendered via Portal */}
      {showMentionDropdown && createPortal(
        <MentionDropdown
          query={mentionQuery}
          position={mentionPosition}
          triggerType={mentionTriggerType}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentionDropdown(false)}
        />,
        document.body
      )}
    </div>
  );
};

export default MessageInput;
