import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChatStore } from "../store/useChatStore";

function ConfirmDeleteModal({ messageId, onClose }) {
  const { deleteMessage } = useChatStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleConfirm = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await deleteMessage(messageId);
      onClose();
    } catch (error) {
      console.error("Failed to delete message:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return createPortal(
    <dialog className={`modal ${isVisible ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-md">
        <h3 className="text-lg font-semibold text-base-content mb-4">Confirm Delete</h3>
        <div className="alert alert-warning text-warning-content mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>Are you sure you want to delete this message? This action cannot be undone.</span>
        </div>
        <div className="modal-action">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`btn btn-error ${isDeleting ? 'btn-disabled' : ''}`}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>,
    document.body
  );
}

export default ConfirmDeleteModal;