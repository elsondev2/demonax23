import { MessageCircleIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const NoChatHistoryPlaceholder = ({ name, isGroup, members }) => {
  const { setMessageInputText } = useChatStore();
  const { authUser } = useAuthStore();
  
  // Generate personalized templates based on chat type
  const generateTemplates = () => {
    if (isGroup && members && authUser) {
      // For group chats, include user's name and other members
      const otherMembers = members.filter(member => member._id !== authUser._id);
      const otherNames = otherMembers.length > 0 
        ? otherMembers.map(m => (m.fullName || 'Member').split(' ')[0]).join(', ') 
        : 'everyone';
      
      return [
        { text: `👋 Hi ${otherNames}!`, message: `Hi ${otherNames}!` },
        { text: `🤝 How's everyone doing?`, message: `How's everyone doing?` },
        { text: `📅 Group meet soon?`, message: `Would you all like to meet up soon?` },
        { text: `👍 Sounds good to me`, message: `Sounds good to me!` },
        { text: `❓ Need help with anything?`, message: `Does anyone need help with anything?` },
        { text: `🎉 Great news, team!`, message: `I have some great news to share with everyone!` }
      ];
    } else if (name) {
      // For direct chats, use the contact's name
      const firstName = (name || 'there').split(' ')[0];
      return [
        { text: `👋 Hi ${firstName}!`, message: `Hi ${firstName}!` },
        { text: `🤝 How are you?`, message: `How are you doing, ${firstName}?` },
        { text: `📅 Meet up soon?`, message: `Hey ${firstName}, would you like to meet up soon?` },
        { text: `👍 Sounds good`, message: `Sounds good to me, ${firstName}!` },
        { text: `❓ Need help?`, message: `Hey ${firstName}, do you need any help with anything?` },
        { text: `🎉 Great news!`, message: `I have some great news to share with you, ${firstName}!` }
      ];
    } else {
      // Fallback templates when name is not available
      return [
        { text: `👋 Hi there!`, message: `Hi there!` },
        { text: `🤝 How are you?`, message: `How are you doing?` },
        { text: `📅 Meet up soon?`, message: `Would you like to meet up soon?` },
        { text: `👍 Sounds good`, message: `Sounds good to me!` },
        { text: `❓ Need help?`, message: `Do you need any help with anything?` },
        { text: `🎉 Great news!`, message: `I have some great news to share!` }
      ];
    }
  };

  const templates = generateTemplates();

  const handleTemplateClick = (message) => {
    // Set the message in the input area
    setMessageInputText(message);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-5">
        <MessageCircleIcon className="size-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-base-content mb-3">
        Start your conversation{name ? ` with ${name}` : ''}
      </h3>
      <div className="flex flex-col space-y-3 max-w-md mb-5">
        <p className="text-base-content/70 text-sm">
          This is the beginning of your conversation. Send a message to start chatting!
        </p>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto"></div>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {templates.map((template, index) => (
          <button 
            key={index}
            onClick={() => handleTemplateClick(template.message)}
            className="btn btn-xs btn-primary btn-outline"
          >
            {template.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NoChatHistoryPlaceholder;