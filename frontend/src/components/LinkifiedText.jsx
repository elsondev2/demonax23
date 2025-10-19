import React from 'react';

/**
 * Component that detects URLs in text and converts them to clickable links
 * Opens links in new tab with security attributes
 */
const LinkifiedText = ({ text, className = '' }) => {
  if (!text) return null;

  // Regex to detect URLs
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;

  // Split text into parts (text and URLs)
  const parts = [];
  let lastIndex = 0;
  let match;

  const textStr = String(text);

  while ((match = urlRegex.exec(textStr)) !== null) {
    // Add text before the URL
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: textStr.substring(lastIndex, match.index),
      });
    }

    // Add the URL
    let url = match[0];
    let href = url;

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      href = 'https://' + url;
    }

    parts.push({
      type: 'link',
      content: url,
      href: href,
    });

    lastIndex = match.index + url.length;
  }

  // Add remaining text
  if (lastIndex < textStr.length) {
    parts.push({
      type: 'text',
      content: textStr.substring(lastIndex),
    });
  }

  // If no URLs found, return plain text
  if (parts.length === 0) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'link') {
          return (
            <a
              key={index}
              href={part.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part.content}
            </a>
          );
        }
        return <React.Fragment key={index}>{part.content}</React.Fragment>;
      })}
    </span>
  );
};

export default LinkifiedText;
