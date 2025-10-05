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
      <div className="modal-box max-w-md">
        <h3 className="text-lg font-semibold text-base-content mb-4">Edit Message</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="textarea textarea-bordered w-full mb-4"
            rows="4"
            placeholder="Edit your message..."
          />
          <div className="modal-action">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              disabled={isEditing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`btn btn-primary ${isEditing ? 'loading' : ''}`}
              disabled={(!editedText.trim() || editedText === message.text) || isEditing}
            >
              {isEditing ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>,
    document.body
  );
}

export default MessageEditModal;