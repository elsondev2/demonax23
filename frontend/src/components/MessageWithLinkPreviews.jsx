import React, { useMemo } from 'react';
import RichText from './RichText';
import LinkPreview from './LinkPreview';

/**
 * Component that displays message text with linkified URLs, mentions, and shows previews for detected links
 */
const MessageWithLinkPreviews = ({ text, mentions = [], isOwnMessage, className = '', urls: providedUrls }) => {
  // Extract URLs from text or use provided URLs
  const urls = useMemo(() => {
    // If URLs are provided directly, use them
    if (providedUrls && providedUrls.length > 0) {
      return providedUrls;
    }
    
    if (!text) return [];
    
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
    const foundUrls = [];
    let match;
    
    const textStr = String(text);
    
    while ((match = urlRegex.exec(textStr)) !== null) {
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
  }, [text, providedUrls]);

  return (
    <div className={className}>
      {/* Rich text with links and mentions */}
      <RichText text={text} mentions={mentions} />
      
      {/* Link previews */}
      {urls.map((url, index) => (
        <LinkPreview 
          key={`${url}-${index}`} 
          url={url} 
          isOwnMessage={isOwnMessage} 
        />
      ))}
    </div>
  );
};

export default MessageWithLinkPreviews;
