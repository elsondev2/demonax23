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
      {/* Main Editor Card */}
      <div className="bg-base-100 border border-base-300 rounded-xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="bg-base-200/50 p-2 md:p-3 border-b border-base-300">
          <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center gap-0.5 md:gap-1 pr-2 border-r border-base-300">
            <button
              type="button"
              onClick={() => applyFormat('bold')}
              className="btn btn-xs md:btn-sm btn-ghost hover:bg-base-300"
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('italic')}
              className="btn btn-xs md:btn-sm btn-ghost hover:bg-base-300"
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('underline')}
              className="btn btn-xs md:btn-sm btn-ghost hover:bg-base-300"
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyFormat('strikeThrough')}
              className="btn btn-xs md:btn-sm btn-ghost hover:bg-base-300"
              title="Strikethrough"
            >
              <Strikethrough className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Font Size */}
          <div className="dropdown dropdown-bottom pr-2 border-r border-base-300">
            <button
              type="button"
              tabIndex={0}
              className="btn btn-xs md:btn-sm btn-ghost gap-1 hover:bg-base-300"
              title="Font Size"
            >
              <Type className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-xs hidden md:inline capitalize">{fontSize}</span>
            </button>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-lg w-40 z-50 border border-base-300">
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
          <div className="relative pr-2 border-r border-base-300">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="btn btn-xs md:btn-sm btn-ghost gap-1 hover:bg-base-300"
              title="Text Color"
            >
              <Palette className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <div 
                className="w-3 h-3 rounded-full border-2 border-base-300 shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
            </button>
            
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-2 bg-base-100 rounded-xl shadow-xl p-4 z-50 border border-base-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Text Color</span>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(false)}
                    className="btn btn-xs btn-ghost btn-circle hover:bg-base-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => applyColor(color)}
                      className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${
                        selectedColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-base-300'
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
          <div className="flex items-center gap-0.5 md:gap-1 pr-2 border-r border-base-300">
            <button
              type="button"
              onClick={() => applyAlignment('left')}
              className={`btn btn-xs md:btn-sm btn-ghost hover:bg-base-300 ${textAlign === 'left' ? 'bg-base-300' : ''}`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('center')}
              className={`btn btn-xs md:btn-sm btn-ghost hover:bg-base-300 ${textAlign === 'center' ? 'bg-base-300' : ''}`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('right')}
              className={`btn btn-xs md:btn-sm btn-ghost hover:bg-base-300 ${textAlign === 'right' ? 'bg-base-300' : ''}`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={() => applyAlignment('justify')}
              className={`btn btn-xs md:btn-sm btn-ghost hover:bg-base-300 ${textAlign === 'justify' ? 'bg-base-300' : ''}`}
              title="Justify"
            >
              <AlignJustify className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Special Inserts */}
          <div className="flex items-center gap-0.5 md:gap-1 pr-2 border-r border-base-300">
            <button
              type="button"
              ref={emojiBtnRef}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="btn btn-xs md:btn-sm btn-ghost hover:bg-base-300"
              title="Add Emoji"
            >
              <Smile className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={insertMention}
              className="btn btn-xs md:btn-sm btn-ghost hover:bg-base-300"
              title="Mention (@)"
            >
              <AtSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <button
              type="button"
              onClick={insertHashtag}
              className="btn btn-xs md:btn-sm btn-ghost hover:bg-base-300"
              title="Hashtag (#)"
            >
              <Hash className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
          </div>

          {/* Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`btn btn-xs md:btn-sm btn-ghost gap-1 hover:bg-base-300 ${showPreview ? 'bg-base-300' : ''}`}
            title="Toggle Preview"
          >
            {showPreview ? <EyeOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            <span className="text-xs hidden md:inline">Preview</span>
          </button>
        </div>
        </div>

        {/* Editor / Preview */}
        <div className="relative">
          {showPreview ? (
            <div className="min-h-[200px] md:min-h-[250px] p-4 md:p-5 bg-base-100">
              <div 
                className="prose prose-sm md:prose-base max-w-none"
                dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || '' }}
              />
            </div>
          ) : (
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              className={`min-h-[200px] md:min-h-[250px] p-4 md:p-5 bg-base-100 focus:outline-none text-sm md:text-base ${
                isOverLimit ? 'text-error' : 'text-base-content'
              }`}
              data-placeholder={placeholder}
              style={{
                maxHeight: '400px',
                overflowY: 'auto'
              }}
            />
          )}

          {/* Character Counter Badge */}
          <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4">
            <div className={`badge badge-sm md:badge-md font-medium ${
              isOverLimit 
                ? 'badge-error' 
                : charCount > maxLength * 0.9 
                  ? 'badge-warning' 
                  : 'badge-ghost'
            }`}>
              {charCount}/{maxLength}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-base-300"></div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 md:p-4 bg-base-200/50">
          <div className="text-xs text-base-content/50 hidden md:block">
            💡 Tip: <kbd className="kbd kbd-xs">Ctrl</kbd>+<kbd className="kbd kbd-xs">B</kbd> (bold), <kbd className="kbd kbd-xs">Ctrl</kbd>+<kbd className="kbd kbd-xs">I</kbd> (italic), <kbd className="kbd kbd-xs">Ctrl</kbd>+<kbd className="kbd kbd-xs">U</kbd> (underline), <kbd className="kbd kbd-xs">Ctrl</kbd>+<kbd className="kbd kbd-xs">S</kbd> (save)
          </div>
          <div className="flex items-center gap-2 justify-end">
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-sm btn-ghost hover:bg-base-300"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!text.trim() || isOverLimit}
              className="btn btn-sm btn-primary shadow-sm"
            >
              Save Caption
            </button>
          </div>
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
