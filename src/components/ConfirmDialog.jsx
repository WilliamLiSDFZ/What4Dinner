// Shared by the delete confirmations on My Menu and the recipe detail page.
// AddDish's leave prompt deliberately does not use this: it is driven by
// useBlocker and has no async or error state, so folding it in would mean
// widening this component for a single caller.
export default function ConfirmDialog({
  message,
  error,
  busy,
  cancelLabel,
  confirmLabel,
  busyLabel,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{message}</p>
        {error && <p className="menu-status menu-error">{error}</p>}
        {/* Both disabled in flight so a double-click cannot fire twice. */}
        <div className="modal-actions">
          <button type="button" className="modal-cancel" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="modal-confirm" disabled={busy} onClick={onConfirm}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
