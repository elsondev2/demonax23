import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "../store/useChatStore";

function MessageEditModal({ message, onClose }) {
  const [editedText, setEditedText] = useState(message.text || "");
  const { editMessage } = useChatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!editedText.trim() || editedText === message.text) || isEditing) return;
    
    setIsEditing(true);
    try {
      await editMessage(message._id, editedText);
      onClose();
    } catch (error) {
      console.error("Failed to edit message:", error);
    } finally {
      setIsEditing(false);
    }
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
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="textarea textarea-bordered w-full focus:textarea-primary resize-none"
              rows="5"
              placeholder="Edit your message..."
              autoFocus
            />
            <div className="label">
              <span className="label-text-alt text-base-content/50">
                {editedText.length} characters
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
      </div>
      <form method="dialog" className="modal-backdrop bg-black/50 backdrop-blur-sm">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>,
    document.body
  );
}

export default MessageEditModal;