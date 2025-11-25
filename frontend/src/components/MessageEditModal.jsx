import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "../store/useChatStore";
import { Smile } from "lucide-react";
import WYSIWYGMessageInput from "./WYSIWYGMessageInput";
import FormattingToolbar from "./FormattingToolbar";
import EmojiPickerModal from "./EmojiPickerModal";
import { useWYSIWYGEditor } from "../hooks/useWYSIWYGEditor";

function MessageEditModal({ message, onClose }) {
  const [editedText, setEditedText] = useState(message.text || "");
  const { editMessage } = useChatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isFormattingExpanded, setIsFormattingExpanded] = useState(false);
  const emojiBtnRef = useRef(null);

  // WYSIWYG Editor
  const {
    commandsRef,
    activeFormats,
    applyFormat,
    getPlainText,
    getHtml,
    handleFormatChange,
  } = useWYSIWYGEditor();

  // Trigger entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Initialize editor with existing text
  useEffect(() => {
    if (commandsRef.current && message.text) {
      commandsRef.current.setText(message.text);
    }
  }, [commandsRef, message.text]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const plainText = getPlainText();
    const htmlContent = getHtml();
    
    if ((!plainText.trim() || plainText === message.text) || isEditing) return;
    
    setIsEditing(true);
    try {
      await editMessage(message._id, plainText, htmlContent);
      onClose();
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      setIsEditing(false);
    }
  };

  const handleFormatToggle = (formatType) => {
    applyFormat(formatType);
  };

  return createPortal(
    <dialog className={`modal ${isVisible ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-xl rounded-xl p-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300">
          <h3 className="text-lg font-bold text-base-content">Edit Message</h3>
          <p className="text-sm text-base-content/60 mt-1">Make changes to your message</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="form-control">
            {/* WYSIWYG Editor with formatting */}
            <div className="relative">
              <WYSIWYGMessageInput
                onChange={(newText) => setEditedText(newText)}
                onEnter={() => {
                  const plainText = getPlainText();
                  if (plainText.trim()) {
                    handleSubmit(new Event('submit'));
                  }
                }}
                onFormatChange={handleFormatChange}
                placeholder="Edit your message..."
                maxLength={2000}
                commandsRef={commandsRef}
                className="min-h-[120px]"
              />

              {/* Formatting Toolbar - Inside textarea */}
              <div className="absolute right-10 top-2">
                <FormattingToolbar
                  isExpanded={isFormattingExpanded}
                  onToggle={() => setIsFormattingExpanded(!isFormattingExpanded)}
                  activeFormats={activeFormats}
                  onFormatToggle={handleFormatToggle}
                />
              </div>

              {/* Emoji Button - Inside textarea */}
              <button
                type="button"
                ref={emojiBtnRef}
                onClick={() => setIsEmojiOpen(v => !v)}
                className="absolute right-2 top-2 btn btn-xs btn-ghost btn-circle text-base-content/70 hover:text-primary"
                title="Add emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
            </div>

            <div className="label">
              <span className="label-text-alt text-base-content/50">
                {editedText.length} / 2000 characters
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1 hover:bg-base-200"
              disabled={isEditing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 shadow-sm"
              disabled={(!editedText.trim() || editedText === message.text) || isEditing}
            >
              {isEditing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>

        {/* Emoji Picker Modal */}
        <EmojiPickerModal 
          isOpen={isEmojiOpen} 
          onClose={() => setIsEmojiOpen(false)} 
          onSelectEmoji={(emoji) => {
            const newText = (editedText || "") + emoji;
            setEditedText(newText);
            if (commandsRef.current) {
              commandsRef.current.setText(newText);
              requestAnimationFrame(() => {
                commandsRef.current?.focus();
              });
            }
          }} 
          triggerRef={emojiBtnRef} 
          keepMounted={false} 
        />
      </div>
      <form method="dialog" className="modal-backdrop bg-black/50 backdrop-blur-sm">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>,
    document.body
  );
}

export default MessageEditModal;