import { useState, useRef, useEffect, useCallback } from 'react';
import { Bold, Italic, Smile, AtSign, Hash } from 'lucide-react';
import EmojiPickerModal from '../EmojiPickerModal';
import AdvancedCaptionEditor from './AdvancedCaptionEditor';

const CaptionMaker = ({
    mode = 'quick', // 'quick' | 'advanced'
    initialValue = '',
    maxLength = 500,
    onSave,
    onCancel,
    allowedFormats = ['bold', 'italic', 'emoji', 'mention', 'hashtag'],
    placeholder = 'Write your caption...',
    context = 'pulse' // 'pulse' | 'post' | 'track' | 'message' | 'status'
}) => {
    const [text, setText] = useState(initialValue);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(0);
    const [formatting, setFormatting] = useState([]);
    const textareaRef = useRef(null);
    const emojiBtnRef = useRef(null);

    // Character count
    const charCount = text.length;
    const isOverLimit = charCount > maxLength;

    // Get max length based on context
    const getMaxLength = () => {
        const contextLimits = {
            pulse: 280,
            post: 5000,
            track: 1000,
            message: 2000,
            status: 150
        };
        return contextLimits[context] || maxLength;
    };

    const actualMaxLength = getMaxLength();

    // Handle text change
    const handleTextChange = (e) => {
        const newText = e.target.value;
        if (newText.length <= actualMaxLength) {
            setText(newText);
            setCursorPosition(e.target.selectionStart);
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        const textarea = textareaRef.current;
        const start = cursorPosition || textarea.selectionStart;
        const newText = text.substring(0, start) + emoji + text.substring(start);

        if (newText.length <= actualMaxLength) {
            setText(newText);
            // Set cursor after emoji
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
            }, 0);
        }
    };

    // Apply formatting
    const applyFormat = useCallback((formatType) => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = text.substring(start, end);

        if (!selectedText) return;

        let formattedText = selectedText;
        let wrapper = '';

        switch (formatType) {
            case 'bold':
                wrapper = '**';
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                wrapper = '_';
                formattedText = `_${selectedText}_`;
                break;
            default:
                return;
        }

        const newText = text.substring(0, start) + formattedText + text.substring(end);

        if (newText.length <= actualMaxLength) {
            setText(newText);

            // Store formatting info
            setFormatting([...formatting, {
                type: formatType,
                start,
                end: start + formattedText.length,
                value: selectedText
            }]);

            // Restore selection
            setTimeout(() => {
                textarea.selectionStart = start + wrapper.length;
                textarea.selectionEnd = end + wrapper.length;
                textarea.focus();
            }, 0);
        }
    }, [text, formatting, actualMaxLength]);

    // Insert mention trigger
    const insertMention = () => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const newText = text.substring(0, start) + '@' + text.substring(start);

        if (newText.length <= actualMaxLength) {
            setText(newText);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
                textarea.focus();
            }, 0);
        }
    };

    // Insert hashtag trigger
    const insertHashtag = () => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const newText = text.substring(0, start) + '#' + text.substring(start);

        if (newText.length <= actualMaxLength) {
            setText(newText);
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + 1;
                textarea.focus();
            }, 0);
        }
    };

    // Handle save
    const handleSave = () => {
        if (!text.trim()) return;

        const captionData = {
            text: text.trim(),
            formatting,
            length: text.trim().length,
            context
        };

        onSave?.(captionData);
    };

    // Handle cancel
    const handleCancel = () => {
        setText(initialValue);
        setFormatting([]);
        onCancel?.();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'b' && allowedFormats.includes('bold')) {
                    e.preventDefault();
                    applyFormat('bold');
                } else if (e.key === 'i' && allowedFormats.includes('italic')) {
                    e.preventDefault();
                    applyFormat('italic');
                }
            }
        };

        const textarea = textareaRef.current;
        if (textarea) {
            textarea.addEventListener('keydown', handleKeyDown);
            return () => textarea.removeEventListener('keydown', handleKeyDown);
        }
    }, [text, allowedFormats, applyFormat]);

    // If advanced mode, use AdvancedCaptionEditor
    if (mode === 'advanced') {
        return (
            <AdvancedCaptionEditor
                initialValue={initialValue}
                maxLength={actualMaxLength}
                onSave={onSave}
                onCancel={onCancel}
                placeholder={placeholder}
                context={context}
            />
        );
    }

    return (
        <div className="caption-maker w-full">
            {/* Textarea */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    placeholder={placeholder}
                    className={`textarea textarea-bordered w-full resize-none ${isOverLimit ? 'textarea-error' : 'focus:textarea-primary'
                        }`}
                    rows={mode === 'quick' ? 3 : 6}
                    style={{ minHeight: mode === 'quick' ? '80px' : '150px' }}
                />

                {/* Character counter */}
                <div className={`absolute bottom-2 right-2 text-xs ${isOverLimit ? 'text-error' : charCount > actualMaxLength * 0.9 ? 'text-warning' : 'text-base-content/60'
                    }`}>
                    {charCount}/{actualMaxLength}
                </div>
            </div>

            {/* Format Toolbar */}
            <div className="flex items-center justify-between mt-2 p-2 bg-base-200 rounded-lg">
                <div className="flex items-center gap-1">
                    {allowedFormats.includes('bold') && (
                        <button
                            type="button"
                            onClick={() => applyFormat('bold')}
                            className="btn btn-xs btn-ghost"
                            title="Bold (Ctrl+B)"
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                    )}

                    {allowedFormats.includes('italic') && (
                        <button
                            type="button"
                            onClick={() => applyFormat('italic')}
                            className="btn btn-xs btn-ghost"
                            title="Italic (Ctrl+I)"
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                    )}

                    <div className="divider divider-horizontal mx-1"></div>

                    {allowedFormats.includes('emoji') && (
                        <button
                            type="button"
                            ref={emojiBtnRef}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="btn btn-xs btn-ghost"
                            title="Add Emoji"
                        >
                            <Smile className="w-4 h-4" />
                        </button>
                    )}

                    {allowedFormats.includes('mention') && (
                        <button
                            type="button"
                            onClick={insertMention}
                            className="btn btn-xs btn-ghost"
                            title="Mention (@)"
                        >
                            <AtSign className="w-4 h-4" />
                        </button>
                    )}

                    {allowedFormats.includes('hashtag') && (
                        <button
                            type="button"
                            onClick={insertHashtag}
                            className="btn btn-xs btn-ghost"
                            title="Hashtag (#)"
                        >
                            <Hash className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="btn btn-xs btn-ghost"
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={!text.trim() || isOverLimit}
                        className="btn btn-xs btn-primary"
                    >
                        {context === 'message' ? 'Send' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Helper text */}
            {mode === 'quick' && (
                <div className="text-xs text-base-content/60 mt-2">
                    Tip: Select text and use Ctrl+B for bold, Ctrl+I for italic
                </div>
            )}

            {/* Emoji Picker Modal */}
            <EmojiPickerModal
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onSelectEmoji={handleEmojiSelect}
                triggerRef={emojiBtnRef}
                keepMounted={false}
            />
        </div>
    );
};

export default CaptionMaker;
