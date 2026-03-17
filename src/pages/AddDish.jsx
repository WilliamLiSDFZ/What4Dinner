import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AddDish() {
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <div className="add-dish-page">
        <button className="add-dish-return" onClick={() => setShowConfirm(true)}>
          <i className="bi-arrow-left" /> Return
        </button>
      </div>
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>Are you sure you want to leave? Your changes will be lost.</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="modal-confirm" onClick={() => navigate(-1)}>Leave</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
