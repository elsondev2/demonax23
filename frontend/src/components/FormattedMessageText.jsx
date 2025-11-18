import MessageWithLinkPreviews from './MessageWithLinkPreviews';

/**
 * Component to display message text with link embeds
 * Always shows link previews/embeds regardless of HTML formatting
 */
const FormattedMessageText = ({ message, isOwnMessage }) => {
  // Get the text content - prefer plain text, fallback to stripping HTML
  const textContent = message.text || (message.html ? message.html.replace(/<[^>]*>/g, ' ').trim() : '');
  
  // Always use MessageWithLinkPreviews to handle text and embeds
  return (
    <MessageWithLinkPreviews 
      text={textContent} 
      mentions={message.mentions} 
      isOwnMessage={isOwnMessage} 
    />
  );
};

export default FormattedMessageText;
