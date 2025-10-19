import { parseMentions } from '../utils/mentionParser';

/**
 * Component that renders text with parsed mentions
 * Automatically converts @mentions and #groups to clickable chips
 */
const MentionText = ({ text, mentions = [], className = '' }) => {
  const parsedContent = parseMentions(text, mentions);

  return (
    <span className={className}>
      {parsedContent}
    </span>
  );
};

export default MentionText;
