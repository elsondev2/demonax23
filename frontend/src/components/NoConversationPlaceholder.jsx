import { MessageCircleIcon } from "lucide-react";

const NoConversationPlaceholder = () => {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <div className="flex flex-col items-center text-center p-6">
        <div className="size-20 bg-primary/20 rounded-full flex items-center justify-center mb-6">
          <MessageCircleIcon className="size-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold text-base-content mb-2">Select a conversation</h3>
        <p className="text-base-content/70 max-w-md">
          Choose a contact from the sidebar to start chatting or continue a previous conversation.
        </p>
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;