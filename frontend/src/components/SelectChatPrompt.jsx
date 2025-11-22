import { MessageSquare, ArrowLeft } from 'lucide-react';

const SelectChatPrompt = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-base-100 p-6">
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-primary/10 rounded-full p-6">
            <MessageSquare className="w-16 h-16 text-primary" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-base-content">
            No Recent Chat
          </h2>
          <p className="text-base-content/70">
            You haven't chatted with anyone yet. Select a chat from the sidebar to start messaging.
          </p>
        </div>

        {/* Swipe hint for mobile */}
        <div className="md:hidden flex items-center justify-center gap-2 text-sm text-base-content/50">
          <ArrowLeft className="w-4 h-4" />
          <span>Swipe left to go back</span>
        </div>
      </div>
    </div>
  );
};

export default SelectChatPrompt;
