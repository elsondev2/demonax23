import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import MentionDropdown from './MentionDropdown';

/**
 * Textarea with smart mention support
 * Detects @ and # triggers and shows dropdown
 */
const MentionTextarea = ({
  value = '',
  onChange,
  onMentionsChange,
  placeholder = 'Type @ to mention...',
  className = '',
  rows = 3,
  maxLength,
  disabled = false,
}) => {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [mentionTriggerType, setMentionTriggerType] = useState('user');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentions, setMentions] = useState([]);
  const textareaRef = useRef(null);

  // Detect @ or # trigger
  const detectMention = (text, cursorPos) => {
    let i = cursorPos - 1;
    while (i >= 0 && text[i] !== ' ' && text[i] !== '\n') {
      if (text[i] === '@') {
        const query = text.substring(i + 1, cursorPos);
        return { trigger: '@', startIndex: i, query, type: 'user' };
      }
      if (text[i] === '#') {
        const query = text.substring(i + 1, cursorPos);
        return { trigger: '#', startIndex: i, query, type: 'group' };
      }
      i--;
    }
    return null;
  };

  // Calculate dropdown position above textarea, within viewport
  const calculateMentionPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    const rect = textarea.getBoundingClientRect();
    const dropdownHeight = 320;
    const dropdownWidth = 280;
    
    // Calculate position above textarea
    let top = rect.top - dropdownHeight - 8;
    let left = rect.left;
    
    // Ensure dropdown stays within viewport
    const viewportWidth = window.innerWidth;
    
    // Adjust horizontal position if needed
    if (left + dropdownWidth > viewportWidth - 20) {
      left = viewportWidth - dropdownWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }
    
    // Adjust vertical position if needed
    if (top < 20) {
      // If not enough space above, position below textarea instead
      top = rect.bottom + 8;
    }
    
    return { top, left };
  };

  // Handle text change with mention detection
  const handleTextChange = (e) => {
    const newText = e.target.value;
    onChange?.(newText);
    
    const cursorPos = e.target.selectionStart;
    const mention = detectMention(newText, cursorPos);

    if (mention) {
      setShowMentionDropdown(true);
      setMentionQuery(mention.query);
      setMentionStartIndex(mention.startIndex);
      setMentionTriggerType(mention.type);
      setMentionPosition(calculateMentionPosition());
    } else {
      setShowMentionDropdown(false);
      setMentionQuery('');
      setMentionStartIndex(-1);
    }
  };

  // Handle mention selection
  const handleMentionSelect = (item) => {
    const textarea = textareaRef.current;
    if (!textarea || mentionStartIndex === -1) return;

    const beforeMention = value.substring(0, mentionStartIndex);
    const afterMention = value.substring(textarea.selectionStart);

    const mentionText = mentionTriggerType === 'user'
      ? `@${item.username || item.fullName}`
      : `#${item.name}`;

    const newText = beforeMention + mentionText + ' ' + afterMention;
    onChange?.(newText);

    // Track mention
    const newMentions = [...mentions, {
      type: mentionTriggerType,
      id: item._id || item.id,
      name: item.fullName || item.name,
      username: item.username,
      position: mentionStartIndex
    }];
    setMentions(newMentions);
    onMentionsChange?.(newMentions);

    // Close dropdown
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartIndex(-1);

    // Set cursor after mention
    setTimeout(() => {
      const newCursorPos = mentionStartIndex + mentionText.length + 1;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMentionDropdown && textareaRef.current && !textareaRef.current.contains(e.target)) {
        setShowMentionDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentionDropdown]);

  return (
    <>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && showMentionDropdown) {
            e.preventDefault();
            setShowMentionDropdown(false);
          }
        }}
        placeholder={placeholder}
        className={className}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
      />
      
      {/* Smart Mention Dropdown - Rendered via Portal */}
      {showMentionDropdown && createPortal(
        <MentionDropdown
          query={mentionQuery}
          position={mentionPosition}
          triggerType={mentionTriggerType}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentionDropdown(false)}
        />,
        document.body
      )}
    </>
  );
};

export default MentionTextarea;
