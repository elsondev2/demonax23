import { useMemo } from 'react';
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
    
    // More robust URL regex that captures full URLs including query params and paths
    const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
    const foundUrls = [];
    let match;
    
    const textStr = String(text);
    
    while ((match = urlRegex.exec(textStr)) !== null) {
      let url = match[0];
      // Clean up trailing punctuation that's not part of the URL
      url = url.replace(/[.,;:!?)]+$/, '');
      
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
