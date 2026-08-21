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
  // One row per cooking step:
  // { id, instruction, required, images: [{ id, file, url }], imageIndex }.
  // `imageIndex` is view-only carousel position — it lives on the step so that
  // removing a slide can re-clamp it in the same updater.
  const [steps, setSteps] = useState([])
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const inputRef = useRef(null)
  // One hidden file input per step row, keyed by step id.
  const stepInputs = useRef({})
  const navigate = useNavigate()

  // Every createObjectURL needs a matching revoke or the blob is held for the
  // life of the document. The unmount cleanup reads through a ref so it sees the
  // current list rather than the empty array it would otherwise close over; the
  // ref is synced in its own effect because writing one during render is not allowed.
  const imagesRef = useRef(images)
  useEffect(() => { imagesRef.current = images }, [images])
  useEffect(() => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url)), [])

  // Same contract one level deeper: step images are blobs too.
  const stepsRef = useRef(steps)
  useEffect(() => { stepsRef.current = steps }, [steps])
  useEffect(() => () => {
    stepsRef.current.forEach((step) => step.images.forEach((image) => URL.revokeObjectURL(image.url)))
  }, [])

  // Escape closes the enlarged photo, matching the row menu on the Favorites page.
  useEffect(() => {
    if (!lightboxUrl) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setLightboxUrl(null) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [lightboxUrl])

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

  function addStep() {
    // Steps start out required; unticking marks one as skippable.
    setSteps((prev) => [
      ...prev,
      { id: crypto.randomUUID(), instruction: '', required: true, images: [], imageIndex: 0 },
    ])
  }

  function updateStep(id, patch) {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...patch } : step)))
  }

  function deleteStep(id) {
    const going = steps.find((step) => step.id === id)
    if (going) going.images.forEach((image) => URL.revokeObjectURL(image.url))
    setSteps((prev) => prev.filter((step) => step.id !== id))
  }

  // Mirrors addFiles: ids and object URLs are minted out here so the development
  // double-invoke of the updater cannot leak a discarded first set.
  function addStepFiles(id, fileList) {
    const added = [...fileList]
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))
    if (added.length === 0) return
    setSteps((prev) => prev.map((step) => (
      step.id === id ? { ...step, images: [...step.images, ...added] } : step
    )))
  }

  function removeStepImage(id, imageId) {
    const going = steps.find((step) => step.id === id)?.images.find((image) => image.id === imageId)
    if (going) URL.revokeObjectURL(going.url)
    setSteps((prev) => prev.map((step) => {
      if (step.id !== id) return step
      const remaining = step.images.filter((image) => image.id !== imageId)
      // Keep the carousel pointing at a slide that still exists.
      return { ...step, images: remaining, imageIndex: Math.min(step.imageIndex, Math.max(remaining.length - 1, 0)) }
    }))
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

            <div className="add-dish-steps">
              <span className="add-dish-label">{t('addDish.stepsLabel')}</span>
              <ol className="step-list">
                {steps.map((step, index) => (
                  <li className="step-row" key={step.id}>
                    <div className="step-index">
                      <span className="step-number">{index + 1}</span>
                      <button
                        type="button"
                        className="step-delete"
                        aria-label={t('addDish.deleteStep')}
                        onClick={() => deleteStep(step.id)}
                      >
                        <i className="bi-trash" />
                      </button>
                    </div>

                    <div className="step-body">
                      <textarea
                        className="add-dish-textarea step-instruction"
                        rows={3}
                        value={step.instruction}
                        placeholder={t('addDish.stepPlaceholder')}
                        onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
                      />
                      <label className="step-required">
                        <input
                          type="checkbox"
                          checked={step.required}
                          onChange={(e) => updateStep(step.id, { required: e.target.checked })}
                        />
                        {t('addDish.stepRequired')}
                      </label>
                    </div>

                    <div className="step-media">
                      {step.images.length === 0 ? (
                        <button
                          type="button"
                          className="step-upload"
                          aria-label={t('addDish.addStepPhoto')}
                          onClick={() => stepInputs.current[step.id]?.click()}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => { e.preventDefault(); addStepFiles(step.id, e.dataTransfer.files) }}
                        >
                          <i className="bi-plus-lg" />
                        </button>
                      ) : (
                        <div className="step-carousel">
                          <div className="step-carousel-frame">
                            <button
                              type="button"
                              className="step-carousel-image"
                              aria-label={t('addDish.enlargePhoto')}
                              onClick={() => setLightboxUrl(step.images[step.imageIndex].url)}
                            >
                              <img src={step.images[step.imageIndex].url} alt="" />
                            </button>
                            <button
                              type="button"
                              className="add-dish-thumb-remove"
                              aria-label={t('addDish.removePhoto')}
                              onClick={() => removeStepImage(step.id, step.images[step.imageIndex].id)}
                            >
                              <i className="bi-x-lg" />
                            </button>
                            {/* Wrapping indices keeps a two-photo carousel usable in one direction. */}
                            <button
                              type="button"
                              className="step-carousel-nav is-prev"
                              aria-label={t('addDish.prevPhoto')}
                              disabled={step.images.length < 2}
                              onClick={() => updateStep(step.id, {
                                imageIndex: (step.imageIndex - 1 + step.images.length) % step.images.length,
                              })}
                            >
                              <i className="bi-chevron-left" />
                            </button>
                            <button
                              type="button"
                              className="step-carousel-nav is-next"
                              aria-label={t('addDish.nextPhoto')}
                              disabled={step.images.length < 2}
                              onClick={() => updateStep(step.id, {
                                imageIndex: (step.imageIndex + 1) % step.images.length,
                              })}
                            >
                              <i className="bi-chevron-right" />
                            </button>
                            <span className="step-carousel-count">
                              {step.imageIndex + 1} / {step.images.length}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="step-add-image"
                            onClick={() => stepInputs.current[step.id]?.click()}
                          >
                            <i className="bi-plus-lg" /> {t('addDish.addStepPhoto')}
                          </button>
                        </div>
                      )}
                      <input
                        ref={(el) => {
                          if (el) stepInputs.current[step.id] = el
                          else delete stepInputs.current[step.id]
                        }}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={(e) => { addStepFiles(step.id, e.target.files); e.target.value = '' }}
                      />
                    </div>
                  </li>
                ))}
              </ol>
              <button type="button" className="step-add" onClick={addStep}>
                <i className="bi-plus-lg" /> {t('addDish.addStep')}
              </button>
            </div>

            {/* Only the title is required — the backend allows a null description. */}
            <button type="submit" className="add-dish-save" disabled={!title.trim()}>
              {t('addDish.save')}
            </button>
          </form>
        )}
      </div>

      {lightboxUrl && (
        // Clicking anywhere on the scrim closes it; the image swallows its own
        // clicks so a mis-hit on the photo does not dismiss.
        <div className="modal-overlay is-lightbox" onClick={() => setLightboxUrl(null)}>
          <img
            className="lightbox-image"
            src={lightboxUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

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
