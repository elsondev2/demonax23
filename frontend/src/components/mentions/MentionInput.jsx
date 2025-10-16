import { useState, useRef, useCallback, useEffect } from 'react';
import MentionDropdown from './MentionDropdown';

const MentionInput = ({
    value = '',
    onChange,
    onMention,
    placeholder = 'Type @ to mention...',
    className = '',
    maxLength,
    disabled = false,
    multiline = false,
    rows = 3
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const [triggerType, setTriggerType] = useState('user');
    const inputRef = useRef(null);

    // Detect @ or # trigger
    const detectMention = useCallback((text, cursorPos) => {
        // Look backwards from cursor to find @ or #
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
    }, []);

    // Calculate dropdown position
    const calculatePosition = useCallback(() => {
        const input = inputRef.current;
        if (!input) return { top: 0, left: 0 };

        const rect = input.getBoundingClientRect();

        if (multiline) {
            // For textarea, approximate position
            return {
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX
            };
        } else {
            // For input, position below
            return {
                top: rect.bottom + window.scrollY + 5,
                left: rect.left + window.scrollX
            };
        }
    }, [multiline]);

    // Handle text change
    const handleChange = useCallback((e) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart;

        onChange?.(newValue);

        // Check for mention trigger
        const mention = detectMention(newValue, cursorPos);

        if (mention) {
            setShowDropdown(true);
            setMentionQuery(mention.query);
            setMentionStartIndex(mention.startIndex);
            setTriggerType(mention.type);
            setMentionPosition(calculatePosition());
        } else {
            setShowDropdown(false);
            setMentionQuery('');
            setMentionStartIndex(-1);
        }
    }, [onChange, detectMention, calculatePosition]);

    // Handle mention selection
    const handleMentionSelect = useCallback((item) => {
        const input = inputRef.current;
        if (!input || mentionStartIndex === -1) return;

        const beforeMention = value.substring(0, mentionStartIndex);
        const afterMention = value.substring(input.selectionStart);

        // Format mention based on type
        const mentionText = triggerType === 'user'
            ? `@${item.username || item.fullName}`
            : `#${item.name}`;

        const newValue = beforeMention + mentionText + ' ' + afterMention;

        onChange?.(newValue);
        onMention?.({
            type: triggerType,
            id: item._id || item.id,
            name: item.fullName || item.name,
            username: item.username,
            position: mentionStartIndex
        });

        // Close dropdown
        setShowDropdown(false);
        setMentionQuery('');
        setMentionStartIndex(-1);

        // Set cursor after mention
        setTimeout(() => {
            const newCursorPos = mentionStartIndex + mentionText.length + 1;
            input.setSelectionRange(newCursorPos, newCursorPos);
            input.focus();
        }, 0);
    }, [value, mentionStartIndex, triggerType, onChange, onMention]);

    // Handle dropdown close
    const handleDropdownClose = useCallback(() => {
        setShowDropdown(false);
        setMentionQuery('');
        setMentionStartIndex(-1);
    }, []);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showDropdown && inputRef.current && !inputRef.current.contains(e.target)) {
                handleDropdownClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown, handleDropdownClose]);

    const inputProps = {
        ref: inputRef,
        value,
        onChange: handleChange,
        placeholder,
        className,
        maxLength,
        disabled
    };

    return (
        <div className="relative">
            {multiline ? (
                <textarea
                    {...inputProps}
                    rows={rows}
                />
            ) : (
                <input
                    {...inputProps}
                    type="text"
                />
            )}

            {showDropdown && (
                <MentionDropdown
                    query={mentionQuery}
                    position={mentionPosition}
                    triggerType={triggerType}
                    onSelect={handleMentionSelect}
                    onClose={handleDropdownClose}
                />
            )}
        </div>
    );
};

export default MentionInput;
