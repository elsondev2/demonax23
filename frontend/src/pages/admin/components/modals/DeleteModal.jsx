export default function DeleteModal({ deleteModal, setDeleteModal, handleDelete }) {
  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg text-error">Confirm Deletion</h3>
        <p className="py-4 text-base-content/70">
          Are you sure you want to delete <strong className="text-base-content">{deleteModal.name}</strong>? This action cannot be undone.
        </p>
        <div className="modal-action">
          <button className="btn" onClick={() => setDeleteModal(null)}>Cancel</button>
          <button className="btn btn-error" onClick={handleDelete}>Delete</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => setDeleteModal(null)}>close</button>
      </form>
    </dialog>
  );
}
