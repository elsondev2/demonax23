import { MessageSquare, Users, Search } from 'lucide-react';

const NoChatSelected = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-base-100 p-6">
      <div className="max-w-md text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="bg-primary/10 rounded-full p-8">
            <MessageSquare className="w-20 h-20 text-primary" />
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-base-content">
            No Chat Selected
          </h2>
          <p className="text-base-content/70 text-lg">
            Select a conversation from the sidebar to start messaging
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 pt-4">
          <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
            <div className="bg-primary/20 rounded-full p-2">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-base-content">Start a Conversation</p>
              <p className="text-sm text-base-content/60">Choose from your contacts</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
            <div className="bg-primary/20 rounded-full p-2">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-medium text-base-content">Search Messages</p>
              <p className="text-sm text-base-content/60">Find past conversations</p>
            </div>
          </div>
        </div>

        {/* Mobile hint */}
        <div className="md:hidden pt-4">
          <p className="text-sm text-base-content/50">
            Swipe left to explore more features
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
