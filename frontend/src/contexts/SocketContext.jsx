import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { authUser, socket: authSocket, onlineUsers } = useAuthStore();
  const [rankingsSocket, setRankingsSocket] = useState(null);

  useEffect(() => {
    if (authUser && authSocket) {
      // Use the existing auth socket for rankings updates
      const socket = authSocket;

      // Listen for follow/unfollow events to update rankings
      const handleFollowUpdate = (data) => {
        console.log('Follow update received:', data);
        // Emit custom event for rankings component
        window.dispatchEvent(new CustomEvent('followUpdate', { detail: data }));
      };

      const handleUnfollowUpdate = (data) => {
        console.log('Unfollow update received:', data);
        // Emit custom event for rankings component
        window.dispatchEvent(new CustomEvent('unfollowUpdate', { detail: data }));
      };

      socket.on('followUpdate', handleFollowUpdate);
      socket.on('unfollowUpdate', handleUnfollowUpdate);

      setRankingsSocket(socket);

      return () => {
        socket.off('followUpdate', handleFollowUpdate);
        socket.off('unfollowUpdate', handleUnfollowUpdate);
      };
    }
  }, [authUser, authSocket]);

  return (
    <SocketContext.Provider value={{ socket: rankingsSocket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};