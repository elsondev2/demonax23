import { useMemo } from 'react';
import MessageWithLinkPreviews from './MessageWithLinkPreviews';

const FormattedMessageText = ({ message, isOwnMessage }) => {
  const urls = useMemo(() => {
    const content = message.html || message.text || '';
    if (!content) return [];
    
    const foundUrls = [];
    
    if (message.html) {
      const hrefRegex = /href=["']([^"']+)["']/g;
      let match;
      while ((match = hrefRegex.exec(content)) !== null) {
        const url = match[1];
        if ((url.startsWith('http://') || url.startsWith('https://')) && !foundUrls.includes(url)) {
          foundUrls.push(url);
        }
      }
    }
    
    const plainText = content.replace(/<[^>]*>/g, ' ');
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    let match;
    
    while ((match = urlRegex.exec(plainText)) !== null) {
      let url = match[0];
      url = url.replace(/[.,;:!?)]+$/, '');
      
      if (!foundUrls.includes(url)) {
        foundUrls.push(url);
      }
    }
    
    return foundUrls;
  }, [message.html, message.text]);

  if (message.html && message.html.trim()) {
    const sanitizeHtml = (html) => {
      let clean = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/on\w+='[^']*'/g, '')
        .replace(/javascript:/gi, '');
      
      const allowedTags = ['p', 'strong', 'em', 'u', 's', 'br', 'b', 'i', 'a', 'span', 'div'];
      const tagPattern = /<\/?(\w+)([^>]*)>/g;
      
      clean = clean.replace(tagPattern, (match, tag, attrs) => {
        if (allowedTags.includes(tag.toLowerCase())) {
          if (tag.toLowerCase() === 'a') {
            const hrefMatch = attrs.match(/href=["']([^"']*)["']/);
            if (hrefMatch) {
              const href = hrefMatch[1];
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

  return (
    <MessageWithLinkPreviews 
      text={message.text} 
      mentions={message.mentions} 
      isOwnMessage={isOwnMessage} 
    />
  );
};

export default FormattedMessageText;
