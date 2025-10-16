import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, Italic, Underline, Strikethrough, Smile, AtSign, Hash, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Palette, X, Eye, EyeOff
} from 'lucide-react';
import EmojiPickerModal from '../EmojiPickerModal';

const AdvancedCaptionEditor = ({
  initialValue = '',
  maxLength = 5000,
  onSave,
  onCancel,
  placeholder = 'Write your caption...',
  context = 'post'
}) => {
  const [text, setText] = useState(initialValue);
  const [showPreview, setShowPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [fontSize, setFontSize] = useState('normal');
  const [textAlign, setTextAlign] = useState('left');
  
  const editorRef = useRef(null);
  const emojiBtnRef = useRef(null);

  // Character count
  const charCount = text.length;
  const isOverLimit = charCount > maxLength;

  // Predefined colors
  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#008000',
    '#FFC0CB', '#A52A2A', '#808080', '#FFFFFF'
  ];

  // Font sizes
  const fontSizes = [
    { value: 'small', label: 'Small', class: 'text-sm' },
    { value: 'normal', label: 'Normal', class: 'text-base' },
    { value: 'large', label: 'Large', class: 'text-lg' },
    { value: 'xlarge', label: 'Extra Large', class: 'text-xl' }
  ];

  // Apply formatting
  const applyFormat = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  // Handle text change
  const handleInput = useCallback(() => {
    const plainText = editorRef.current?.innerText || '';
    
    if (plainText.length <= maxLength) {
      setText(plainText);
    } else {
      // Revert to previous state if over limit
      editorRef.current.innerHTML = text;
    }
  }, [maxLength, text]);

  // Handle emoji selection
  const handleEmojiSelect = useCallback((emoji) => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(emoji));
    range.collapse(false);
    handleInput();
  }, [handleInput]);

  // Insert mention
  const insertMention = useCallback(() => {
    applyFormat('insertText', '@');
  }, [applyFormat]);

  // Insert hashtag
  const insertHashtag = useCallback(() => {
    applyFormat('insertText', '#');
  }, [applyFormat]);

  // Apply color
  const applyColor = useCallback((color) => {
    applyFormat('foreColor', color);
    setSelectedColor(color);
    setShowColorPicker(false);
  }, [applyFormat]);

  // Apply font size
  const applyFontSize = useCallback((size) => {
    const sizeMap = {
      small: '1',
      normal: '3',
      large: '5',
      xlarge: '7'
    };
    applyFormat('fontSize', sizeMap[size]);
    setFontSize(size);
  }, [applyFormat]);

  // Apply text alignment
  const applyAlignment = useCallback((align) => {
    const alignMap = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull'
    };
    applyFormat(alignMap[align]);
    setTextAlign(align);
  }, [applyFormat]);

  // Handle save
  const handleSave = useCallback(() => {
    if (!text.trim()) return;

    const captionData = {
      text: text.trim(),
      html: editorRef.current?.innerHTML || '',
      length: text.trim().length,
      context,
      formatting: {
        fontSize,
        textAlign,
        color: selectedColor
      }
    };

    onSave?.(captionData);
  }, [text, context, fontSize, textAlign, selectedColor, onSave]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    setText('');
    onCancel?.();
  }, [onCancel]);

  // Initialize editor
  useEffect(() => {
    if (editorRef.current && initialValue) {
      editorRef.current.innerHTML = initialValue;
      setText(editorRef.current.innerText);
    }
  }, [initialValue]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            applyFormat('bold');
            break;
          case 'i':
            e.preventDefault();
            applyFormat('italic');
            break;
          case 'u':
            e.preventDefault();
            applyFormat('underline');
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          default:
            break;
        }
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('keydown', handleKeyDown);
      return () => editor.removeEventListener('keydown', handleKeyDown);
    }
  }, [applyFormat, handleSave]);

  return (
    <div className="advanced-caption-editor w-full">
      {/* Toolbar */}
      <div className="bg-base-200 rounded-t-lg p-2 border-b border-base-300">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center gap-1 border-r border-base-300 pr-2">
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              className="btn btn-xs btn-ghost"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('italic')}
              className="btn btn-xs btn-ghost"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('underline')}
              className="btn btn-xs btn-ghost"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('strikeThrough')}
              className="btn btn-xs btn-ghost"
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Font Size */}
          <div className="dropdown dropdown-bottom border-r border-base-300 pr-2">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-xs btn-ghost gap-1"
              title="Font Size"
            >
              <Type className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">{fontSize}</span>
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 z-50">
              {fontSizes.map((size) => (
                <li key={size.value}>
                  <button
                    type="button"
                    onClick={() => applyFontSize(size.value)}
                    className={fontSize === size.value ? 'active' : ''}
                  >
                    <span className={size.class}>{size.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Text Color */}
          <div className="relative border-r border-base-300 pr-2">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="btn btn-xs btn-ghost gap-1"
              title="Text Color"
            >
              <Palette className="w-4 h-4" />
              <div 
                className="w-3 h-3 rounded border border-base-300"
                style={{ backgroundColor: selectedColor }}
              />
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 bg-base-100 rounded-lg shadow-lg p-3 z-50 border border-base-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold">Text Color</span>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(false)}
                    className="btn btn-xs btn-ghost btn-circle"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => applyColor(color)}
                      className={`w-6 h-6 rounded border-2 ${
                        selectedColor === color ? 'border-primary' : 'border-base-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Alignment */}
          <div className="flex items-center gap-1 border-r border-base-300 pr-2">
            <button
              type="button"
              onClick={() => applyAlignment('left')}
              className={`btn btn-xs btn-ghost ${textAlign === 'left' ? 'btn-active' : ''}`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('center')}
              className={`btn btn-xs btn-ghost ${textAlign === 'center' ? 'btn-active' : ''}`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('right')}
              className={`btn btn-xs btn-ghost ${textAlign === 'right' ? 'btn-active' : ''}`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('justify')}
              className={`btn btn-xs btn-ghost ${textAlign === 'justify' ? 'btn-active' : ''}`}
              title="Justify"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>

          {/* Special Inserts */}
          <div className="flex items-center gap-1 border-r border-base-300 pr-2">
            <button
              type="button"
              ref={emojiBtnRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="btn btn-xs btn-ghost"
              title="Add Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={insertMention}
              className="btn btn-xs btn-ghost"
              title="Mention (@)"
            >
              <AtSign className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={insertHashtag}
              className="btn btn-xs btn-ghost"
              title="Hashtag (#)"
            >
              <Hash className="w-4 h-4" />
            </button>
          </div>

          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`btn btn-xs btn-ghost ${showPreview ? 'btn-active' : ''}`}
            title="Toggle Preview"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span className="text-xs hidden sm:inline ml-1">Preview</span>
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="relative">
        {showPreview ? (
          <div className="min-h-[200px] p-4 bg-base-100 rounded-b-lg border border-base-300 border-t-0">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || '' }}
            />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            className={`min-h-[200px] p-4 bg-base-100 rounded-b-lg border focus:outline-none focus:border-primary ${
              isOverLimit ? 'border-error' : 'border-base-300'
            } border-t-0`}
            data-placeholder={placeholder}
            style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}
          />
        )}

        {/* Character counter */}
        <div className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-base-200 ${
          isOverLimit ? 'text-error' : charCount > maxLength * 0.9 ? 'text-warning' : 'text-base-content/60'
        }`}>
          {charCount}/{maxLength}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-base-content/60">
          Tip: Use Ctrl+B (bold), Ctrl+I (italic), Ctrl+U (underline), Ctrl+S (save)
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-sm btn-ghost"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!text.trim() || isOverLimit}
            className="btn btn-sm btn-primary"
          >
            Save Caption
          </button>
        </div>
      </div>

      {/* Emoji Picker Modal */}
      <EmojiPickerModal
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleEmojiSelect}
        triggerRef={emojiBtnRef}
        keepMounted={false}
      />

      {/* Custom Styles */}
      <style jsx>{`
        [contentEditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default AdvancedCaptionEditor;
