import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

export default function SocketStatusIndicator() {
  const { socket } = useAuthStore();
  const { isSubscribed } = useChatStore();
  
  const isConnected = socket?.connected;
  
  // Only show if there's an issue
  if (isConnected && isSubscribed) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`badge gap-2 ${isConnected ? 'badge-warning' : 'badge-error'}`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`} />
        {!isConnected && 'Disconnected'}
        {isConnected && !isSubscribed && 'Connecting...'}
      </div>
    </div>
  );
}
