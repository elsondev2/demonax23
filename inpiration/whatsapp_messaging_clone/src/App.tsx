import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState, useEffect, useRef } from "react";
import type { Id } from "../convex/_generated/dataModel";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Toaster />
      <Unauthenticated>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-green-600 mb-2">WhatsApp Clone</h1>
              <p className="text-gray-600">Sign in to start messaging</p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <MessagingApp />
      </Authenticated>
    </div>
  );
}

function MessagingApp() {
  const [selectedChannelId, setSelectedChannelId] = useState<Id<"channels"> | null>(null);
  const [showUserList, setShowUserList] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Chats</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowUserList(true)}
              className="p-2 hover:bg-green-700 rounded-full transition-colors"
              title="New Chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <SignOutButton />
          </div>
        </div>
        <ChannelList
          selectedChannelId={selectedChannelId}
          onSelectChannel={setSelectedChannelId}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannelId ? (
          <ChatArea channelId={selectedChannelId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-24 h-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xl">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* User List Modal */}
      {showUserList && (
        <UserListModal
          onClose={() => setShowUserList(false)}
          onSelectUser={(channelId) => {
            setSelectedChannelId(channelId);
            setShowUserList(false);
          }}
        />
      )}
    </div>
  );
}

function ChannelList({
  selectedChannelId,
  onSelectChannel,
}: {
  selectedChannelId: Id<"channels"> | null;
  onSelectChannel: (id: Id<"channels">) => void;
}) {
  const channels = useQuery(api.messages.listChannels) || [];

  return (
    <div className="flex-1 overflow-y-auto">
      {channels.map((channel) => (
        <button
          key={channel._id}
          onClick={() => onSelectChannel(channel._id)}
          className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
            selectedChannelId === channel._id ? "bg-gray-100" : ""
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
            {channel.otherUser?.name?.[0]?.toUpperCase() || channel.otherUser?.email?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <div className="font-semibold text-gray-900 truncate">
              {channel.otherUser?.name || channel.otherUser?.email || "Unknown User"}
            </div>
            {channel.lastMessage && (
              <div className="text-sm text-gray-500 truncate">
                {channel.lastMessage.type === "voice" ? "🎤 Voice message" : channel.lastMessage.content}
              </div>
            )}
          </div>
        </button>
      ))}
      {channels.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <p>No chats yet</p>
          <p className="text-sm mt-2">Click + to start a new conversation</p>
        </div>
      )}
    </div>
  );
}

function ChatArea({ channelId }: { channelId: Id<"channels"> }) {
  const messages = useQuery(api.messages.listMessages, { channelId }) || [];
  const channelStatus = useQuery(api.messages.getChannelStatus, { channelId }) || [];
  const channels = useQuery(api.messages.listChannels) || [];
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const sendMessage = useMutation(api.messages.sendMessage);
  const updateStatus = useMutation(api.messages.updateStatus);

  const [messageText, setMessageText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const channel = channels.find((c) => c._id === channelId);
  const otherUser = channel?.otherUser;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = (text: string) => {
    setMessageText(text);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (text.trim()) {
      updateStatus({ channelId, status: "typing" });
      typingTimeoutRef.current = setTimeout(() => {
        updateStatus({ channelId, status: "idle" });
      }, 3000);
    } else {
      updateStatus({ channelId, status: "idle" });
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    await sendMessage({
      channelId,
      content: messageText,
      type: "text",
    });
    setMessageText("");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      await updateStatus({ channelId, status: "recording" });
      
      // Simulate recording for 2 seconds
      setTimeout(async () => {
        await sendMessage({
          channelId,
          content: "Voice message",
          type: "voice",
        });
        setIsRecording(false);
        await updateStatus({ channelId, status: "idle" });
      }, 2000);
    }
  };

  const activeStatus = channelStatus[0];

  return (
    <>
      {/* Chat Header */}
      <div className="bg-green-600 text-white p-4 flex items-center gap-3 shadow-md">
        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center font-semibold">
          {otherUser?.name?.[0]?.toUpperCase() || otherUser?.email?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{otherUser?.name || otherUser?.email || "Unknown User"}</div>
          {activeStatus && (
            <div className="text-sm text-green-100">
              {activeStatus.status === "typing" && "typing..."}
              {activeStatus.status === "recording" && "🎤 recording..."}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5]">
        {messages.map((message) => {
          const isOwn = message.authorId === loggedInUser?._id;
          return (
            <div
              key={message._id}
              className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg shadow ${
                  isOwn
                    ? "bg-green-500 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none"
                }`}
              >
                {message.type === "voice" ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{message.content}</span>
                  </div>
                ) : (
                  <p className="break-words">{message.content}</p>
                )}
                <div className={`text-xs mt-1 ${isOwn ? "text-green-100" : "text-gray-500"}`}>
                  {new Date(message._creationTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="bg-gray-100 p-4 flex items-center gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => handleTyping(e.target.value)}
          placeholder="Type a message"
          className="flex-1 px-4 py-3 rounded-full bg-white border border-gray-300 focus:outline-none focus:border-green-500"
          disabled={isRecording}
        />
        {messageText.trim() ? (
          <button
            type="submit"
            className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRecording}
            disabled={isRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isRecording
                ? "bg-red-600 text-white animate-pulse"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </form>
    </>
  );
}

function UserListModal({
  onClose,
  onSelectUser,
}: {
  onClose: () => void;
  onSelectUser: (channelId: Id<"channels">) => void;
}) {
  const users = useQuery(api.messages.listUsers) || [];
  const createChannel = useMutation(api.messages.createChannel);

  const handleSelectUser = async (userId: Id<"users">) => {
    const channelId = await createChannel({ otherUserId: userId });
    onSelectUser(channelId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">New Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {users.map((user) => (
            <button
              key={user._id}
              onClick={() => handleSelectUser(user._id)}
              className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-lg">
                {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">{user.name || user.email}</div>
                {user.email && user.name && (
                  <div className="text-sm text-gray-500">{user.email}</div>
                )}
              </div>
            </button>
          ))}
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No other users available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
