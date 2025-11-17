import MessageWithLinkPreviews from './MessageWithLinkPreviews';

/**
 * Component to display formatted message text
 * Supports both HTML (from WYSIWYG editor) and plain text
 */
const FormattedMessageText = ({ message, isOwnMessage }) => {
  // If message has HTML content, render it with formatting
  if (message.html && message.html.trim()) {
    // Simple sanitization - only allow specific formatting tags
    const sanitizeHtml = (html) => {
      // Remove any script tags and dangerous attributes
      let clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/on\w+='[^']*'/g, '');
      
      // Only allow specific tags
      const allowedTags = ['p', 'strong', 'em', 'u', 's', 'br', 'b', 'i'];
      const tagPattern = /<\/?(\w+)[^>]*>/g;
      
      clean = clean.replace(tagPattern, (match, tag) => {
        if (allowedTags.includes(tag.toLowerCase())) {
          return match;
        }
        return '';
      });
      
      return clean;
    };

    const sanitizedHtml = sanitizeHtml(message.html);

    return (
      <div 
        className="formatted-message leading-relaxed"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Fallback to plain text with link previews
  return <MessageWithLinkPreviews text={message.text} mentions={message.mentions} isOwnMessage={isOwnMessage} />;
};

export default FormattedMessageText;
