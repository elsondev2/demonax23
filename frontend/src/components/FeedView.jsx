import { useChatStore } from '../store/useChatStore';
import ChatContainer from './ChatContainer';
import NoConversationPlaceholder from './NoConversationPlaceholder';

/**
 * FeedView - The middle view that shows either active chat or placeholder
 * This is the "Cassisiacum" view when no chat is selected
 */
export default function FeedView() {
  const { selectedUser, selectedGroup } = useChatStore();

  return (
    <div className="flex-1 flex flex-col h-full">
      {(selectedUser || selectedGroup) ? (
        <ChatContainer />
      ) : (
        <NoConversationPlaceholder />
      )}
    </div>
  );
}
