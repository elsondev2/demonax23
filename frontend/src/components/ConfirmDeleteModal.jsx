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
      <div className="modal-box max-w-md bg-base-100 border border-base-300 shadow-xl rounded-xl p-0">
        {/* Header */}
        <div className="px-5 py-4 border-b border-base-300">
          <h3 className="text-lg font-bold text-base-content">Delete Message</h3>
          <p className="text-sm text-base-content/60 mt-1">This action cannot be undone</p>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="alert alert-warning shadow-sm border border-warning/30">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm">
              <div className="font-semibold mb-1">Are you sure?</div>
              <div className="text-warning-content/80">This message will be permanently deleted and cannot be recovered.</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost flex-1 hover:bg-base-200"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn btn-error flex-1 shadow-sm"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Deleting...
                </>
              ) : (
                "Delete Message"
              )}
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop bg-black/50 backdrop-blur-sm">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>,
    document.body
  );
}

export default ConfirmDeleteModal;