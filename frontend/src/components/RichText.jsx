import React from 'react';
import MentionChip from './mentions/MentionChip';

/**
 * Component that renders text with both clickable links, mention chips, and markdown formatting
 * Supports: **bold**, *italic*, ~~strikethrough~~, __underline__
 */
const RichText = ({ text, mentions = [], className = '' }) => {
  if (!text) return null;

  const textStr = String(text);
  
  // Combined regex for URLs, mentions, and markdown formatting
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/g;
  const mentionRegex = /(@everyone|@here|@[\w.-]+|#[\w\s-]+)/g;
  // Markdown formatting regex - order matters for proper parsing
  const markdownRegex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)|(__[^_]+__)|(_[^_]+_)|(~~[^~]+~~)/g;

  // Create a map of mention positions for quick lookup
  const mentionMap = new Map();
  mentions.forEach(mention => {
    // Map by username for users (primary key)
    if (mention.username) {
      mentionMap.set(`user:${mention.username}`, mention);
    }
    // Map by name as fallback
    if (mention.name) {
      mentionMap.set(`${mention.type}:${mention.name}`, mention);
    }
  });

  // Find all matches (URLs, mentions, and markdown)
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
    let mentionData = null;
    
    // Try username lookup first for users
    if (mentionType === 'user') {
      mentionData = mentionMap.get(`user:${mentionName}`);
    }
    
    // Fallback to name lookup
    if (!mentionData) {
      mentionData = mentionMap.get(`${mentionType}:${mentionName}`);
    }
    
    if (mentionData) {
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

  // Find markdown formatting
  while ((match = markdownRegex.exec(textStr)) !== null) {
    const matchText = match[0];
    let formatType = 'text';
    let innerText = matchText;
    
    // Determine format type and extract inner text
    if (matchText.startsWith('**') && matchText.endsWith('**')) {
      formatType = 'bold';
      innerText = matchText.slice(2, -2);
    } else if (matchText.startsWith('~~') && matchText.endsWith('~~')) {
      formatType = 'strikethrough';
      innerText = matchText.slice(2, -2);
    } else if (matchText.startsWith('__') && matchText.endsWith('__')) {
      formatType = 'underline';
      innerText = matchText.slice(2, -2);
    } else if (matchText.startsWith('*') && matchText.endsWith('*')) {
      formatType = 'italic';
      innerText = matchText.slice(1, -1);
    } else if (matchText.startsWith('_') && matchText.endsWith('_')) {
      formatType = 'italic';
      innerText = matchText.slice(1, -1);
    }

    matches.push({
      type: 'markdown',
      start: match.index,
      end: match.index + matchText.length,
      content: matchText,
      formatType,
      innerText,
    });
  }

  // Sort matches by position
  matches.sort((a, b) => a.start - b.start);

  // Remove overlapping matches (priority: mentions > URLs > markdown)
  const filteredMatches = [];
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const prev = filteredMatches[filteredMatches.length - 1];
    
    if (!prev || current.start >= prev.end) {
      filteredMatches.push(current);
    } else if (current.type === 'mention' && (prev.type === 'url' || prev.type === 'markdown')) {
      // Replace URL/markdown with mention if they overlap
      filteredMatches[filteredMatches.length - 1] = current;
    } else if (current.type === 'url' && prev.type === 'markdown') {
      // Replace markdown with URL if they overlap
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
    } else if (match.type === 'markdown') {
      // Render markdown formatted text
      let element;
      switch (match.formatType) {
        case 'bold':
          element = <strong key={`md-${keyCounter++}`}>{match.innerText}</strong>;
          break;
        case 'italic':
          element = <em key={`md-${keyCounter++}`}>{match.innerText}</em>;
          break;
        case 'strikethrough':
          element = <span key={`md-${keyCounter++}`} className="line-through">{match.innerText}</span>;
          break;
        case 'underline':
          element = <span key={`md-${keyCounter++}`} className="underline">{match.innerText}</span>;
          break;
        default:
          element = <React.Fragment key={`md-${keyCounter++}`}>{match.content}</React.Fragment>;
      }
      parts.push(element);
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
