import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function AddDish() {
  const { t } = useTranslation()
  const [showConfirm, setShowConfirm] = useState(false)
  // Picked photos, preview-only: { id, file, url }. Nothing is uploaded yet.
  const [images, setImages] = useState([])
  // Once the manual button is pressed the page is cleared to make room for the
  // form that will be specified later.
  const [manual, setManual] = useState(false)
  const [dragging, setDragging] = useState(false)
  // Named after the backend's recipe fields so this can become the POST body as-is.
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Every createObjectURL needs a matching revoke or the blob is held for the
  // life of the document. The unmount cleanup reads through a ref so it sees the
  // current list rather than the empty array it would otherwise close over; the
  // ref is synced in its own effect because writing one during render is not allowed.
  const imagesRef = useRef(images)
  useEffect(() => { imagesRef.current = images }, [images])
  useEffect(() => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url)), [])

  function addFiles(fileList) {
    // Mint the ids and object URLs out here: doing it inside the updater would
    // run twice in development and leak the first set of blob URLs.
    const added = [...fileList]
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))
    setImages((prev) => [...prev, ...added])
  }

  function removeImage(id) {
    // Revoke outside the updater — a state updater must stay pure, and React
    // calls it twice in development to prove that it is.
    const going = images.find((image) => image.id === id)
    if (going) URL.revokeObjectURL(going.url)
    setImages((prev) => prev.filter((image) => image.id !== id))
  }

  return (
    <>
      <div className="add-dish-page">
        <button className="add-dish-return" onClick={() => setShowConfirm(true)}>
          <i className="bi-arrow-left" /> {t('addDish.return')}
        </button>

        {!manual && (
          <>
            <button
              type="button"
              className={`add-dish-dropzone${dragging ? ' is-dragging' : ''}`}
              onClick={() => inputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                addFiles(e.dataTransfer.files)
              }}
            >
              <i className="bi-cloud-arrow-up" />
              <span>{t('addDish.uploadPrompt')}</span>
              <span className="add-dish-hint">{t('addDish.uploadHint')}</span>
            </button>
            {/* Resetting value after a pick lets the same file be chosen again. */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
            />

            {images.length > 0 && (
              <ul className="add-dish-thumbs">
                {images.map((image) => (
                  <li className="add-dish-thumb" key={image.id}>
                    <img src={image.url} alt="" />
                    <button
                      className="add-dish-thumb-remove"
                      aria-label={t('addDish.removePhoto')}
                      onClick={() => removeImage(image.id)}
                    >
                      <i className="bi-x-lg" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button className="add-dish-manual" onClick={() => setManual(true)}>
              <i className="bi-pencil" /> {t('addDish.manualEntry')}
            </button>
          </>
        )}

        {manual && (
          // A real form so Enter submits and the later steps have somewhere to
          // hang validation; there is nothing to send until the create endpoint
          // exists, so the handler only stops the browser navigating.
          <form className="add-dish-form" onSubmit={(e) => e.preventDefault()}>
            <div className="add-dish-field">
              <label className="add-dish-label" htmlFor="dish-title">
                {t('addDish.titleLabel')}
              </label>
              <input
                id="dish-title"
                className="add-dish-input"
                type="text"
                value={title}
                placeholder={t('addDish.titlePlaceholder')}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="add-dish-field">
              <label className="add-dish-label" htmlFor="dish-description">
                {t('addDish.descriptionLabel')}
              </label>
              <textarea
                id="dish-description"
                className="add-dish-textarea"
                rows={4}
                value={description}
                placeholder={t('addDish.descriptionPlaceholder')}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Only the title is required — the backend allows a null description. */}
            <button type="submit" className="add-dish-save" disabled={!title.trim()}>
              {t('addDish.save')}
            </button>
          </form>
        )}
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
