import React from 'react';
import { Bold, Italic, Underline, Strikethrough, MoreVertical } from 'lucide-react';

/**
 * Inline formatting toolbar that appears inside the text input
 * Shows B, I, U, S buttons when expanded
 */
const FormattingToolbar = ({ isExpanded, onToggle, activeFormats, onFormatToggle, disabled = false }) => {
  return (
    <div className="relative flex items-center gap-1">
      {/* Expanded formatting buttons - positioned above on mobile, inline on desktop */}
      {isExpanded && (
        <div className="absolute md:relative bottom-full md:bottom-auto right-0 md:right-auto mb-2 md:mb-0 flex items-center gap-1 bg-base-200 md:bg-transparent p-2 md:p-0 rounded-lg md:rounded-none shadow-lg md:shadow-none border md:border-0 border-base-300">
          {/* Bold Button */}
          <button
            type="button"
            onClick={() => onFormatToggle('bold')}
            disabled={disabled}
            className={`btn btn-xs btn-ghost min-h-0 h-7 w-7 p-0 transition-all ${
              activeFormats.bold 
                ? 'bg-primary text-primary-content hover:bg-primary/80' 
                : 'hover:bg-base-300'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          {/* Italic Button */}
          <button
            type="button"
            onClick={() => onFormatToggle('italic')}
            disabled={disabled}
            className={`btn btn-xs btn-ghost min-h-0 h-7 w-7 p-0 transition-all ${
              activeFormats.italic 
                ? 'bg-primary text-primary-content hover:bg-primary/80' 
                : 'hover:bg-base-300'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          {/* Underline Button */}
          <button
            type="button"
            onClick={() => onFormatToggle('underline')}
            disabled={disabled}
            className={`btn btn-xs btn-ghost min-h-0 h-7 w-7 p-0 transition-all ${
              activeFormats.underline 
                ? 'bg-primary text-primary-content hover:bg-primary/80' 
                : 'hover:bg-base-300'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>

          {/* Strikethrough Button */}
          <button
            type="button"
            onClick={() => onFormatToggle('strikethrough')}
            disabled={disabled}
            className={`btn btn-xs btn-ghost min-h-0 h-7 w-7 p-0 transition-all ${
              activeFormats.strikethrough 
                ? 'bg-primary text-primary-content hover:bg-primary/80' 
                : 'hover:bg-base-300'
            }`}
            title="Strikethrough (Ctrl+Shift+X)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Three-dot toggle button */}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`btn btn-xs btn-ghost min-h-0 h-7 w-7 p-0 transition-all ${
          disabled 
            ? 'text-base-content/30 cursor-not-allowed' 
            : isExpanded
              ? 'bg-base-300'
              : 'hover:bg-base-300'
        }`}
        title="Text formatting"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FormattingToolbar;
