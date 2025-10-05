import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Debug component to show current chat state - only visible in development
 */
export default function ChatDebugInfo() {
  const { 
    selectedUser, 
    selectedGroup, 
    currentConversationId, 
    currentConversationType, 
    messages, 
    isMessagesLoading,
    hasMoreMessages,
    messagesPage,
    refreshCurrentConversation,
    diagnoseMessageRendering,
    lastDiagnosis,
    renderingStats
  } = useChatStore();
  
  const { socket } = useAuthStore();

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const handleRefresh = async () => {
    try {
      await refreshCurrentConversation();
    } catch (error) {
      console.error('Failed to refresh conversation:', error);
    }
  };

  const handleDiagnose = () => {
    diagnoseMessageRendering();
  };

  return (
    <div className="fixed bottom-4 right-4 bg-base-300 p-3 rounded-lg text-xs max-w-sm z-50 opacity-90 max-h-96 overflow-y-auto">
      <div className="font-bold mb-2 flex items-center justify-between">
        Chat Debug Info
        <div className="flex gap-1">
          <button 
            onClick={handleDiagnose}
            className="btn btn-xs btn-secondary"
            title="Run message rendering diagnostics"
          >
            �
          </button>
          <button 
            onClick={handleRefresh}
            className="btn btn-xs btn-primary"
            disabled={isMessagesLoading}
            title="Refresh current conversation to restore missing messages"
          >
            {isMessagesLoading ? '...' : '🔄'}
          </button>
        </div>
      </div>
      
      {/* Basic Info */}
      <div className="mb-2 pb-2 border-b border-base-content/20">
        <div>Selected User: {selectedUser?._id || 'None'}</div>
        <div>Selected Group: {selectedGroup?._id || 'None'}</div>
        <div>Conversation ID: {currentConversationId || 'None'}</div>
        <div>Conversation Type: {currentConversationType || 'None'}</div>
        <div className={`${messages.length < 10 ? 'text-warning' : ''}`}>
          Messages Count: {messages.length}
        </div>
        <div>Loading: {isMessagesLoading ? 'Yes' : 'No'}</div>
        <div>Has More: {hasMoreMessages ? 'Yes' : 'No'}</div>
        <div>Page: {messagesPage}</div>
        <div>Socket: {socket?.connected ? 'Connected' : 'Disconnected'}</div>
      </div>

      {/* Diagnosis Results */}
      {lastDiagnosis && (
        <div className="mt-2">
          <div className="font-bold mb-1 flex items-center gap-2">
            Diagnosis
            <span className={`badge badge-xs ${
              lastDiagnosis.status === 'healthy' ? 'badge-success' :
              lastDiagnosis.status === 'warning' ? 'badge-warning' : 'badge-error'
            }`}>
              {lastDiagnosis.status}
            </span>
            <span className="text-xs">({lastDiagnosis.healthScore}%)</span>
          </div>
          
          {/* Message Details */}
          <div className="mb-2 text-xs">
            <div>Valid: {lastDiagnosis.messageDetails.validMessages}</div>
            <div>Optimistic: {lastDiagnosis.messageDetails.optimisticMessages}</div>
            <div>Duplicates: {lastDiagnosis.messageDetails.duplicateMessages}</div>
            <div>Malformed: {lastDiagnosis.messageDetails.malformedMessages}</div>
          </div>

          {/* Issues */}
          {lastDiagnosis.issues.length > 0 && (
            <div className="mb-2">
              <div className="font-semibold text-error">Issues:</div>
              {lastDiagnosis.issues.slice(0, 3).map((issue, index) => (
                <div key={index} className="text-error text-xs">• {issue}</div>
              ))}
              {lastDiagnosis.issues.length > 3 && (
                <div className="text-xs text-base-content/60">
                  +{lastDiagnosis.issues.length - 3} more issues
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {lastDiagnosis.recommendations.length > 0 && (
            <div className="mb-2">
              <div className="font-semibold text-info">Recommendations:</div>
              {lastDiagnosis.recommendations.slice(0, 2).map((rec, index) => (
                <div key={index} className="text-info text-xs">• {rec}</div>
              ))}
            </div>
          )}

          <div className="text-xs text-base-content/60 mt-1">
            Last check: {new Date(lastDiagnosis.timestamp).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Rendering Stats */}
      {renderingStats && (
        <div className="mt-2 pt-2 border-t border-base-content/20">
          <div className="font-bold mb-1 flex items-center gap-2">
            Rendering
            {renderingStats.mismatch && (
              <span className="badge badge-xs badge-error">MISMATCH</span>
            )}
          </div>
          <div className="text-xs">
            <div>Expected: {renderingStats.expectedCount}</div>
            <div>Rendered: {renderingStats.renderedCount}</div>
            {renderingStats.mismatch && (
              <div className="text-error mt-1">
                <div className="font-semibold">Issues:</div>
                {renderingStats.reasons.slice(0, 2).map((reason, index) => (
                  <div key={index}>• {reason}</div>
                ))}
                {renderingStats.reasons.length > 2 && (
                  <div>+{renderingStats.reasons.length - 2} more</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}