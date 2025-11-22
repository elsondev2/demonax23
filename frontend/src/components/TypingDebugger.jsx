import { useState, useEffect } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Simple debugging component for testing typing indicators
 * Shows real-time typing status for current conversation
 */
const TypingDebugger = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [myTypingStatus, setMyTypingStatus] = useState(false);
  const [socketEvents, setSocketEvents] = useState([]);
  const { selectedUser, selectedGroup, typingUsers } = useChatStore();
  const { authUser, socket } = useAuthStore();
  
  const conversationId = selectedUser?._id || selectedGroup?._id;
  const conversationTypingUsers = conversationId ? typingUsers[conversationId] : {};
  
  // Monitor socket events
  useEffect(() => {
    if (!socket) return;
    
    const addEvent = (type, data) => {
      const timestamp = new Date().toLocaleTimeString();
      setSocketEvents(prev => [
        { type, data, timestamp },
        ...prev.slice(0, 9) // Keep last 10 events
      ]);
    };
    
    const handleUserTyping = (data) => {
      console.log('📥 RECEIVED: userTyping', data);
      addEvent('userTyping', data);
    };
    
    const handleUserStoppedTyping = (data) => {
      console.log('📥 RECEIVED: userStoppedTyping', data);
      addEvent('userStoppedTyping', data);
    };
    
    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);
    
    return () => {
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);
    };
  }, [socket]);
  
  // Monitor input focus to track your typing status
  useEffect(() => {
    const handleFocus = (e) => {
      if (e.target.closest('[contenteditable="true"]') || e.target.tagName === 'TEXTAREA') {
        setMyTypingStatus(true);
      }
    };
    
    const handleBlur = (e) => {
      if (e.target.closest('[contenteditable="true"]') || e.target.tagName === 'TEXTAREA') {
        setMyTypingStatus(false);
      }
    };
    
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);
  
  // Toggle with Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-base-300 border-2 border-primary rounded-lg p-4 shadow-2xl z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">🐛 Typing Debugger</h3>
        <button 
          onClick={() => setIsVisible(false)}
          className="btn btn-ghost btn-xs btn-circle"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="divider my-1">Current User</div>
        <div className="bg-base-100 p-2 rounded">
          <strong>Name:</strong> {authUser?.fullName || 'N/A'}
          <br />
          <strong>Socket:</strong> {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
        
        <div className="divider my-1">Your Typing Status</div>
        <div className={`p-2 rounded ${myTypingStatus ? 'bg-success/20 border border-success' : 'bg-base-100'}`}>
          <strong>Status:</strong> {myTypingStatus ? '⌨️ TYPING' : '💤 Idle'}
          <br />
          <span className="text-xs text-base-content/60">
            {myTypingStatus ? 'Input is focused' : 'Input not focused'}
          </span>
        </div>
        
        <div className="divider my-1">Conversation</div>
        <div className="bg-base-100 p-2 rounded">
          <strong>Type:</strong> {selectedUser ? 'DM' : selectedGroup ? 'Group' : 'None'}
          <br />
          <strong>ID:</strong> {conversationId ? conversationId.slice(0, 12) + '...' : 'N/A'}
        </div>
        
        <div className="divider my-1">Others Typing</div>
        <div className="bg-base-100 p-2 rounded max-h-32 overflow-y-auto">
          {conversationTypingUsers && Object.keys(conversationTypingUsers).length > 0 ? (
            <ul className="space-y-1">
              {Object.entries(conversationTypingUsers).map(([userId, data]) => (
                <li key={userId} className="text-xs">
                  <strong>{data.name}</strong>
                  <br />
                  <span className="text-base-content/60">
                    ID: {userId.slice(0, 8)}...
                    <br />
                    Time: {new Date(data.timestamp).toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-base-content/60">No one else typing</span>
          )}
        </div>
        
        <div className="divider my-1">Socket Events (Last 10)</div>
        <div className="bg-base-100 p-2 rounded max-h-40 overflow-y-auto">
          {socketEvents.length > 0 ? (
            <ul className="space-y-1 text-xs font-mono">
              {socketEvents.map((event, idx) => (
                <li key={idx} className={`p-1 rounded ${
                  event.type === 'userTyping' ? 'bg-success/10' : 'bg-error/10'
                }`}>
                  <strong>{event.timestamp}</strong> - {event.type}
                  <br />
                  <span className="text-base-content/60">
                    {event.data.userName || 'Unknown'} ({event.data.userId?.slice(0, 6)}...)
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-base-content/60">No events yet</span>
          )}
        </div>
        
        <div className="divider my-1">All Conversations</div>
        <div className="bg-base-100 p-2 rounded max-h-24 overflow-y-auto">
          {Object.keys(typingUsers).length > 0 ? (
            <ul className="space-y-1 text-xs">
              {Object.entries(typingUsers).map(([convId, users]) => (
                <li key={convId}>
                  <strong>{convId.slice(0, 8)}...</strong>: {Object.keys(users).length} typing
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-base-content/60">No typing activity</span>
          )}
        </div>
      </div>
      
      <div className="mt-3 text-xs text-base-content/60 text-center">
        Press <kbd className="kbd kbd-xs">Ctrl</kbd> + <kbd className="kbd kbd-xs">Shift</kbd> + <kbd className="kbd kbd-xs">D</kbd> to toggle
      </div>
    </div>
  );
};

export default TypingDebugger;
