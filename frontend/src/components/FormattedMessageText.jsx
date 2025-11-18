import { useMemo } from 'react';
import MessageWithLinkPreviews from './MessageWithLinkPreviews';

/**
 * Component to display formatted message text
 * Supports both HTML (from WYSIWYG editor) and plain text
 */
const FormattedMessageText = ({ message, isOwnMessage }) => {
  // Extract URLs from HTML or text
  const urls = useMemo(() => {
    const content = message.html || message.text || '';
    if (!content) return [];
    
    const urlRegex = /(https?:\/\/[^\s<>"]+)|(www\.[^\s<>"]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s<>"]*)/g;
    const foundUrls = [];
    let match;
    
    // Strip HTML tags to get plain text for URL extraction
    const plainText = content.replace(/<[^>]*>/g, ' ');
    
    while ((match = urlRegex.exec(plainText)) !== null) {
      let url = match[0];
      
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // Only add unique URLs
      if (!foundUrls.includes(url)) {
        foundUrls.push(url);
      }
    }
    
    return foundUrls;
  }, [message.html, message.text]);

  // If message has HTML content, render it with formatting
  if (message.html && message.html.trim()) {
    // Simple sanitization - only allow specific formatting tags including links
    const sanitizeHtml = (html) => {
      // Remove any script tags and dangerous event handlers
      let clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/on\w+='[^']*'/g, '')
        .replace(/javascript:/gi, '');
      
      // Allow specific tags including anchor tags for links
      const allowedTags = ['p', 'strong', 'em', 'u', 's', 'br', 'b', 'i', 'a', 'span', 'div'];
      const tagPattern = /<\/?(\w+)([^>]*)>/g;
      
      clean = clean.replace(tagPattern, (match, tag, attrs) => {
        if (allowedTags.includes(tag.toLowerCase())) {
          // For anchor tags, ensure safe attributes
          if (tag.toLowerCase() === 'a') {
            // Extract href and ensure it's safe
            const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
            if (hrefMatch) {
              const href = hrefMatch[1];
              // Only allow http/https links
              if (href.startsWith('http://') || href.startsWith('https://')) {
                return `<${tag} href="${href}" target="_blank" rel="noopener noreferrer">`;
              }
            }
            return `<${tag}>`;
          }
          return match;
        }
        return '';
      });
      
      return clean;
    };

    const sanitizedHtml = sanitizeHtml(message.html);

    return (
      <div>
        <div 
          className="formatted-message leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
        {/* Show link previews for URLs found in HTML content */}
        {urls.length > 0 && (
          <MessageWithLinkPreviews 
            text="" 
            mentions={message.mentions} 
            isOwnMessage={isOwnMessage}
            urls={urls}
          />
        )}
      </div>
    );
  }

  // Fallback to plain text with link previews
  return <MessageWithLinkPreviews text={message.text} mentions={message.mentions} isOwnMessage={isOwnMessage} />;
};

export default FormattedMessageText;
