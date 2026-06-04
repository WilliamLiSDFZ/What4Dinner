import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function AddDish() {
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <div className="add-dish-page">
        <button className="add-dish-return" onClick={() => setShowConfirm(true)}>
          <i className="bi-arrow-left" /> {t('addDish.return')}
        </button>
      </div>
      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{t('addDish.confirmLeave')}</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowConfirm(false)}>{t('addDish.cancel')}</button>
              <button className="modal-confirm" onClick={() => navigate(-1)}>{t('addDish.leave')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
