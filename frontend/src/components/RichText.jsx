import React from 'react';
import MentionChip from './mentions/MentionChip';

/**
 * Component that renders text with both clickable links and mention chips
 * Combines URL detection and mention parsing
 */
const RichText = ({ text, mentions = [], className = '' }) => {
  if (!text) return null;

  const textStr = String(text);
  
  // Combined regex for URLs and mentions
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  const mentionRegex = /(@everyone|@here|@[\w.-]+|#[\w\s-]+)/g;

  // Create a map of mention positions for quick lookup
  const mentionMap = new Map();
  mentions.forEach(mention => {
    const key = `${mention.type}:${mention.name || mention.username}`;
    mentionMap.set(key, mention);
  });

  // Find all matches (URLs and mentions)
  const matches = [];
  let match;

  // Find URLs
  while ((match = urlRegex.exec(textStr)) !== null) {
    matches.push({
      type: 'url',
      start: match.index,
      end: match.index + match[0].length,
      content: match[0],
    });
  }

  // Find mentions
  while ((match = mentionRegex.exec(textStr)) !== null) {
    const matchText = match[0];
    let mentionType = 'user';
    let mentionName = matchText.substring(1);
    
    if (matchText.startsWith('#')) {
      mentionType = 'group';
    } else if (matchText === '@everyone') {
      mentionType = 'everyone';
      mentionName = 'everyone';
    } else if (matchText === '@here') {
      mentionType = 'here';
      mentionName = 'here';
    }

    // Try to find mention details
    let mentionId = null;
    const mentionKey = `${mentionType}:${mentionName}`;
    
    if (mentionMap.has(mentionKey)) {
      const mentionData = mentionMap.get(mentionKey);
      mentionId = mentionData.id;
      mentionName = mentionData.name || mentionName;
    }

    matches.push({
      type: 'mention',
      start: match.index,
      end: match.index + matchText.length,
      content: matchText,
      mentionType,
      mentionId,
      mentionName,
    });
  }

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (prefer mentions over URLs)
  const filteredMatches = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const prev = filteredMatches[filteredMatches.length - 1];
    
    if (!prev || current.start >= prev.end) {
      filteredMatches.push(current);
    } else if (current.type === 'mention' && prev.type === 'url') {
      // Replace URL with mention if they overlap
      filteredMatches[filteredMatches.length - 1] = current;
    }
  }

  // Build the final output
  const parts = [];
  let lastIndex = 0;
  let keyCounter = 0;

  filteredMatches.forEach((match) => {
    // Add text before match
    if (match.start > lastIndex) {
      parts.push(
        <React.Fragment key={`text-${keyCounter++}`}>
          {textStr.substring(lastIndex, match.start)}
        </React.Fragment>
      );
    }

    // Add the match
    if (match.type === 'url') {
      let href = match.content;
      if (!href.startsWith('http://') && !href.startsWith('https://')) {
        href = 'https://' + href;
      }

      parts.push(
        <a
          key={`url-${keyCounter++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {match.content}
        </a>
      );
    } else if (match.type === 'mention') {
      parts.push(
        <MentionChip
          key={`mention-${keyCounter++}`}
          type={match.mentionType}
          id={match.mentionId}
          name={match.mentionName}
        />
      );
    }

    lastIndex = match.end;
  });

  // Add remaining text
  if (lastIndex < textStr.length) {
    parts.push(
      <React.Fragment key={`text-${keyCounter++}`}>
        {textStr.substring(lastIndex)}
      </React.Fragment>
    );
  }

  return <span className={className}>{parts.length > 0 ? parts : text}</span>;
};

export default RichText;
