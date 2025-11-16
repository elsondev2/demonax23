import MentionChip from '../components/mentions/MentionChip';

/**
 * Parses text and replaces mentions with MentionChip components
 * Supports @user, #group, @everyone, @here patterns
 * Only renders mentions that have valid IDs (were validated)
 */
export const parseMentions = (text, mentions = []) => {
  if (!text) return text;

  // Create a map of mention names/usernames to their data for quick lookup
  const mentionMap = new Map();
  mentions.forEach(mention => {
    // Map by username for users
    if (mention.username) {
      mentionMap.set(`user:${mention.username}`, mention);
    }
    // Map by name for all types
    mentionMap.set(`${mention.type}:${mention.name}`, mention);
  });

  // Pattern to match @username, #groupname, @everyone, @here
  const mentionPattern = /(@everyone|@here|@[\w.-]+|#[\w\s-]+)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = mentionPattern.exec(text)) !== null) {
    const matchText = match[0];
    const matchIndex = match.index;

    // Add text before mention
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    // Determine mention type and name
    let mentionType = 'user';
    let mentionName = matchText.substring(1); // Remove @ or #
    
    if (matchText.startsWith('#')) {
      mentionType = 'group';
    } else if (matchText === '@everyone') {
      mentionType = 'everyone';
      mentionName = 'everyone';
    } else if (matchText === '@here') {
      mentionType = 'here';
      mentionName = 'here';
    }

    // Try to find mention details from mentions array
    let mentionData = null;
    
    // Try username lookup first for users
    if (mentionType === 'user') {
      mentionData = mentionMap.get(`user:${mentionName}`);
    }
    
    // Fallback to name lookup
    if (!mentionData) {
      mentionData = mentionMap.get(`${mentionType}:${mentionName}`);
    }

    // Only render as MentionChip if we have valid mention data with an ID
    // or if it's a special mention (everyone/here)
    if (mentionData && (mentionData.id || mentionType === 'everyone' || mentionType === 'here')) {
      parts.push(
        <MentionChip
          key={`mention-${keyCounter++}`}
          type={mentionType}
          id={mentionData.id}
          name={mentionData.name || mentionName}
        />
      );
    } else {
      // If no valid mention data, render as plain text
      parts.push(matchText);
    }

    lastIndex = matchIndex + matchText.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

/**
 * Extracts mentions from text
 * Returns array of mention objects
 */
export const extractMentions = (text) => {
  if (!text) return [];

  const mentions = [];
  const mentionPattern = /(@everyone|@here|@[\w.-]+|#[\w\s-]+)/g;
  let match;

  while ((match = mentionPattern.exec(text)) !== null) {
    const matchText = match[0];
    let type = 'user';
    let name = matchText.substring(1);

    if (matchText.startsWith('#')) {
      type = 'group';
    } else if (matchText === '@everyone') {
      type = 'everyone';
      name = 'everyone';
    } else if (matchText === '@here') {
      type = 'here';
      name = 'here';
    }

    mentions.push({
      type,
      name,
      position: match.index,
      text: matchText,
    });
  }

  return mentions;
};

/**
 * Validates if a mention exists in the provided mentions array
 */
export const validateMention = (mentionText, mentions = []) => {
  const extracted = extractMentions(mentionText);
  if (extracted.length === 0) return false;

  const mention = extracted[0];
  return mentions.some(m => 
    m.type === mention.type && 
    (m.name === mention.name || m.username === mention.name)
  );
};
