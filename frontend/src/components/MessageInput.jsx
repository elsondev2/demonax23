import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "../store/useChatStore";
import { ImageUpIcon, SendIcon, XIcon, Smile, Paperclip, Mic, StopCircle, FileText, Sparkles } from "lucide-react";
import EmojiPickerModal from "./EmojiPickerModal";
import CaptionImageModal from "./CaptionImageModal";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import useFriendStore from "../store/useFriendStore";
import { generateCaptionImage } from "../utils/captionImageGenerator";
import MentionDropdown from "./mentions/MentionDropdown";

const MessageInput = ({ onInputFocus }) => {
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
  const { sendMessage, selectedUser, selectedGroup, messageInputText, setMessageInputText, quotedMessage, clearQuotedMessage, messages, playKeystrokeSound } = useChatStore();
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [showCaptionImageModal, setShowCaptionImageModal] = useState(false);
  const emojiBtnRef = useRef(null);
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

  // Cleanup audio stream on unmount
  useEffect(() => {
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioStream]);

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

  // Handle text change with mention detection
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
    }
  };

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

    // Track mention
    setMentions(prev => [...prev, {
      type: mentionTriggerType,
      id: item._id || item.id,
      name: item.fullName || item.name,
      username: item.username,
      position: mentionStartIndex
    }]);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

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

    try {
      let imageData = null;
      if (image) {
        // Silently compress and convert image to base64
        const { compressImageToBase64 } = await import('../utils/imageCompression');
        imageData = await compressImageToBase64(image);
      }

      await sendMessage({ text, image: imageData, attachments, audio, mentions });
      setText("");
      setImage(null);
      setPreviewImage(null);
      setAttachments([]);
      setAudio(null);
      setMentions([]);
      clearQuotedMessage(); // Clear quote after sending
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
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
    <div className="px-4 md:px-6 py-4">
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

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* IMAGE INPUT */}
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input file-input-bordered hidden"
            id="image-input"
            disabled={isSending || limitInfo.isLimited}
          />
          <label
            htmlFor="image-input"
            className={`cursor-pointer transition-colors ${isSending ? 'text-base-content/50' : 'text-base-content/70 hover:text-primary'}`}
          >
            <ImageUpIcon className="h-5 w-5" />
          </label>
        </div>

        {/* DOCUMENT ATTACHMENTS */}
        <div className="relative">
          <input type="file" multiple onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            const { compressImageToBase64 } = await import('../utils/imageCompression');
            for (const f of files) {
              // Silently compress in background
              const base64 = await compressImageToBase64(f);
              try {
                const res = await axiosInstance.post('/api/messages/upload-attachment', { base64, filename: f.name });
                setAttachments(prev => [...prev, res.data]);
              } catch { /* empty */ }
            }
            e.target.value = '';
          }} className="file-input file-input-bordered hidden" id="file-input" disabled={isSending || limitInfo.isLimited} />
          <label htmlFor="file-input" className={`cursor-pointer transition-colors ${isSending || limitInfo.isLimited ? 'text-base-content/50' : 'text-base-content/70 hover:text-primary'}`}>
            <Paperclip className="h-5 w-5" />
          </label>
        </div>

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

        {/* AUDIO RECORD */}
        <button
          type="button"
          className={`transition-colors relative ${isSending || limitInfo.isLimited ? 'text-base-content/50' : isRecording ? 'text-error' : 'text-base-content/70 hover:text-primary'}`}
          disabled={limitInfo.isLimited || isProcessingAudio}
          onClick={async () => {
            if (isRecording) {
              // Stop recording
              setIsProcessingAudio(true);
              recorder?.stop();
              setIsRecording(false);
            } else {
              // Start recording with reduced noise suppression
              try {
                const stream = await navigator.mediaDevices.getUserMedia({
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    // Reduce noise suppression intensity
                    advanced: [{ noiseSuppression: { ideal: 0.3 } }]
                  }
                });

                setAudioStream(stream);

                const mr = new MediaRecorder(stream, {
                  mimeType: 'audio/webm',
                  audioBitsPerSecond: 128000
                });

                const chunks = [];
                mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                mr.onstop = async () => {
                  setIsProcessingAudio(true);
                  try {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    const durationSec = Math.round((Date.now() - recordStartTs) / 1000);
                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    await new Promise((r) => (reader.onloadend = r));
                    const base64 = reader.result?.toString();

                    const res = await axiosInstance.post('/api/messages/upload-audio', { base64, durationSec });
                    setAudio(res.data);
                  } catch (error) {
                    console.error('Failed to process audio:', error);
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
              } catch (error) {
                console.error('Failed to start recording:', error);
                alert('Failed to access microphone. Please check permissions.');
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

        {/* TEXT INPUT */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              // Play keystroke sound for actual typing (not special keys)
              if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                playKeystrokeSound();
              }

              // Close mention dropdown on Escape
              if (e.key === 'Escape' && showMentionDropdown) {
                e.preventDefault();
                setShowMentionDropdown(false);
              }
            }}
            onFocus={() => onInputFocus?.()}
            onPaste={handlePaste}
            placeholder={getPlaceholder()}
            className="input input-bordered w-full rounded-full"
            disabled={isSending || limitInfo.isLimited}
            maxLength={2000}
          />
          {text.length > 1800 && (
            <div className="absolute -top-6 right-0 text-xs text-base-content/60 bg-base-100 px-2 py-0.5 rounded">
              {text.length}/2000
            </div>
          )}

        </div>

        {/* EMOJI PICKER (moved to right) */}
        <button type="button" ref={emojiBtnRef} onClick={() => setIsEmojiOpen(v => !v)} disabled={limitInfo.isLimited} className={`transition-colors ${isSending || limitInfo.isLimited ? 'text-base-content/50' : 'text-base-content/70 hover:text-primary'}`}>
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
