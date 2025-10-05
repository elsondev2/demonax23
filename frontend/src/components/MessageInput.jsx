import React, { useState, useEffect, useRef, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { ImageUpIcon, SendIcon, XIcon, Smile, Paperclip, Mic, StopCircle, FileText } from "lucide-react";
import EmojiPickerModal from "./EmojiPickerModal";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import useFriendStore from "../store/useFriendStore";

const MessageInput = ({ onInputFocus }) => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [attachments, setAttachments] = useState([]); // {url, storageKey, contentType, filename, size}
  const [audio, setAudio] = useState(null); // {url, storageKey, contentType, durationSec}
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [recordStartTs, setRecordStartTs] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const { sendMessage, selectedUser, selectedGroup, messageInputText, setMessageInputText, quotedMessage, clearQuotedMessage, messages, playKeystrokeSound } = useChatStore();
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const emojiBtnRef = useRef(null);
  const { authUser } = useAuthStore();
  const friendStore = useFriendStore();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !image && attachments.length === 0 && !audio) || isSending) return;

    setIsSending(true);

    try {
      let imageData = null;
      if (image) {
        // convert image to base64
        const reader = new FileReader();
        reader.readAsDataURL(image);
        await new Promise((resolve) => (reader.onloadend = resolve));
        imageData = reader.result;
      }

      await sendMessage({ text, image: imageData, attachments, audio });
      setText("");
      setImage(null);
      setPreviewImage(null);
      setAttachments([]);
      setAudio(null);
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
    <div className="px-4 md:px-6 py-4 border-t border-base-300/30">
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
        <div className="flex items-center gap-2 mb-2 bg-base-200 rounded-lg px-2 py-1">
          <Mic className="w-4 h-4" />
          <audio src={audio.url} controls className="w-full" />
          <button className="btn btn-ghost btn-xs" onClick={() => setAudio(null)}><XIcon className="w-4 h-4" /></button>
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
            for (const f of files) {
              const reader = new FileReader(); reader.readAsDataURL(f);
              await new Promise((r) => (reader.onloadend = r));
              const base64 = reader.result?.toString();
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

        {/* AUDIO RECORD */}
        <button type="button" className={`transition-colors ${isSending || limitInfo.isLimited ? 'text-base-content/50' : isRecording ? 'text-error' : 'text-base-content/70 hover:text-primary'}`} disabled={limitInfo.isLimited} onClick={async () => {
          if (isRecording) {
            // stop
            recorder?.stop();
            setIsRecording(false);
          } else {
            // start
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const chunks = [];
            mr.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
            mr.onstop = async () => {
              const blob = new Blob(chunks, { type: 'audio/webm' });
              const durationSec = Math.round((Date.now() - recordStartTs) / 1000);
              const reader = new FileReader(); reader.readAsDataURL(blob);
              await new Promise((r) => (reader.onloadend = r));
              const base64 = reader.result?.toString();
              try {
                const res = await axiosInstance.post('/api/messages/upload-audio', { base64, durationSec });
                setAudio(res.data);
              } catch { /* empty */ }
            };
            mr.start();
            setRecorder(mr);
            setRecordStartTs(Date.now());
            setIsRecording(true);
          }
        }}>
          {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        {/* TEXT INPUT */}
        <div className="flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Play keystroke sound for actual typing (not special keys)
              if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                playKeystrokeSound();
              }
            }}
            onFocus={() => onInputFocus?.()}
            onPaste={handlePaste}
            placeholder={getPlaceholder()}
            className="input input-bordered w-full rounded-full"
            disabled={isSending || limitInfo.isLimited}
          />
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
    </div>
  );
};

export default MessageInput;
