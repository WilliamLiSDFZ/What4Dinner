import { useState, useRef, useEffect, useContext } from 'react'
import { useNavigate, useBlocker } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getIngredients, createIngredient } from '../api'
import { SettingsContext } from '../SettingsContext'

export default function AddDish() {
  const { t } = useTranslation()
  const { settings } = useContext(SettingsContext)
  const currency = settings?.family?.currencyUnit
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
  // Only one ingredient picker is open at a time, so its state lives up here
  // rather than being duplicated per row.
  const [pickerStepId, setPickerStepId] = useState(null)
  const [ingredients, setIngredients] = useState([])
  const [ingredientsLoading, setIngredientsLoading] = useState(false)
  const [ingredientsError, setIngredientsError] = useState(null)
  const [search, setSearch] = useState('')
  // Step the ingredient being created should attach to; null when the dialog is closed.
  const [creatingFor, setCreatingFor] = useState(null)
  const [newName, setNewName] = useState('')
  // Kept as strings because they come straight from inputs; both are optional.
  const [newPrice, setNewPrice] = useState('')
  const [newLastPurchase, setNewLastPurchase] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)
  const inputRef = useRef(null)
  // One hidden file input per step row, keyed by step id.
  const stepInputs = useRef({})
  const pickerRef = useRef(null)
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

  // Nothing is persisted until Save exists, so anything the user has entered —
  // including photos picked before switching to manual entry — is worth a
  // confirmation before it is thrown away.
  const isDirty =
    title.trim() !== '' || description.trim() !== '' || steps.length > 0 || images.length > 0

  // Covers the sidebar tabs, the Return button's navigate(-1), and the browser's
  // back/forward buttons. Requires the data router set up in App.jsx.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  // The other half: refreshing, closing the tab, or navigating away from the app
  // entirely. The browser owns this dialog, so its wording cannot be set here.
  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  // Dismiss the picker on Escape or a click outside it, as the Favorites row
  // menu does. The create dialog closes the picker first, so there is no
  // ambiguity about which one Escape targets.
  useEffect(() => {
    if (!pickerStepId) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setPickerStepId(null) }
    const onPointerDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerStepId(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [pickerStepId])

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
      { id: crypto.randomUUID(), instruction: '', required: true, ingredients: [], images: [], imageIndex: 0 },
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

  // Re-fetched on every open so an ingredient created from another step shows up
  // without a reload. Clicking the same step's button again just closes it.
  function togglePicker(stepId) {
    if (pickerStepId === stepId) {
      setPickerStepId(null)
      return
    }
    setPickerStepId(stepId)
    setSearch('')
    setIngredientsError(null)
    setIngredientsLoading(true)
    getIngredients()
      .then((data) => setIngredients(data))
      .catch((err) => setIngredientsError(err.message))
      .finally(() => setIngredientsLoading(false))
  }

  function addIngredient(stepId, ingredient) {
    setSteps((prev) => prev.map((step) => {
      if (step.id !== stepId) return step
      if (step.ingredients.some((i) => i.id === ingredient.id)) return step
      const { id, canonicalName } = ingredient
      return { ...step, ingredients: [...step.ingredients, { id, canonicalName }] }
    }))
  }

  function removeIngredient(stepId, ingredientId) {
    setSteps((prev) => prev.map((step) => (
      step.id === stepId
        ? { ...step, ingredients: step.ingredients.filter((i) => i.id !== ingredientId) }
        : step
    )))
  }

  function openCreateDialog(stepId) {
    // Closing the picker keeps its outside-click handler from firing on clicks
    // inside the dialog.
    setPickerStepId(null)
    setCreatingFor(stepId)
    setNewName('')
    setNewPrice('')
    setNewLastPurchase('')
    setCreateError(null)
  }

  async function submitNewIngredient() {
    const name = newName.trim()
    if (!name) return
    // The confirm button has to be type="button" (it sits inside the outer
    // recipe form), so min="0" is never enforced natively — check it here rather
    // than round-tripping to the server for a 400.
    const referencePrice = newPrice.trim() === '' ? null : Number(newPrice)
    if (referencePrice !== null && (Number.isNaN(referencePrice) || referencePrice < 0)) {
      setCreateError(t('addDish.ingredientInvalid'))
      return
    }
    setCreating(true)
    setCreateError(null)
    try {
      // A date input's value is already yyyy-MM-dd, which is exactly what the
      // endpoint wants, so there is nothing to parse.
      const created = await createIngredient({
        name,
        referencePrice,
        lastPurchase: newLastPurchase || null,
      })
      addIngredient(creatingFor, created)
      setCreatingFor(null)
      setNewName('')
      setNewPrice('')
      setNewLastPurchase('')
    } catch (err) {
      // 409 is a name the family already has, 400 a bad price or date;
      // everything else is reported verbatim.
      setCreateError(
        err.message === 'HTTP 409' ? t('addDish.ingredientExists')
          : err.message === 'HTTP 400' ? t('addDish.ingredientInvalid')
            : t('addDish.createFailed', { message: err.message }),
      )
    } finally {
      setCreating(false)
    }
  }

  function submitOnEnter(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      submitNewIngredient()
    }
  }

  // Built from local date parts on purpose: toISOString() is UTC and would name
  // the wrong day for part of the day in the user's timezone.
  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const searchTerm = search.trim().toLowerCase()
  const matches = ingredients.filter((i) => i.canonicalName.toLowerCase().includes(searchTerm))

  return (
    <>
      <div className="add-dish-page">
        {/* Plain navigation — the blocker above puts the confirmation in front of
            it, so Return, the sidebar tabs and the back button share one path. */}
        <button className="add-dish-return" onClick={() => navigate(-1)}>
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
                      <div className="step-index-tools">
                        <label className="step-required">
                          <input
                            type="checkbox"
                            checked={step.required}
                            onChange={(e) => updateStep(step.id, { required: e.target.checked })}
                          />
                          {t('addDish.stepRequired')}
                        </label>
                        <button
                          type="button"
                          className="step-delete"
                          aria-label={t('addDish.deleteStep')}
                          onClick={() => deleteStep(step.id)}
                        >
                          <i className="bi-trash" />
                        </button>
                      </div>
                    </div>

                    <div className="step-body">
                      <textarea
                        className="add-dish-textarea step-instruction"
                        rows={3}
                        value={step.instruction}
                        placeholder={t('addDish.stepPlaceholder')}
                        onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
                      />

                      <div className="step-ingredients">
                        {step.ingredients.map((ingredient) => (
                          <span className="ingredient-pill" key={ingredient.id}>
                            {ingredient.canonicalName}
                            <button
                              type="button"
                              className="ingredient-pill-remove"
                              aria-label={t('addDish.removeIngredient')}
                              onClick={() => removeIngredient(step.id, ingredient.id)}
                            >
                              <i className="bi-x" />
                            </button>
                          </span>
                        ))}

                        {/* margin-left: auto on the anchor pins the + to the right end. */}
                        <div
                          className="ingredient-anchor"
                          ref={pickerStepId === step.id ? pickerRef : null}
                        >
                          <button
                            type="button"
                            className="ingredient-add"
                            aria-haspopup="listbox"
                            aria-expanded={pickerStepId === step.id}
                            aria-label={t('addDish.addIngredient')}
                            onClick={() => togglePicker(step.id)}
                          >
                            <i className="bi-plus-lg" />
                          </button>

                          {pickerStepId === step.id && (
                            <div className="ingredient-picker">
                              <input
                                className="ingredient-search"
                                type="text"
                                value={search}
                                placeholder={t('addDish.searchIngredient')}
                                onChange={(e) => setSearch(e.target.value)}
                              />
                              {ingredientsLoading && (
                                <p className="ingredient-picker-status">{t('addDish.ingredientsLoading')}</p>
                              )}
                              {ingredientsError && (
                                <p className="ingredient-picker-status menu-error">
                                  {t('addDish.ingredientsError', { message: ingredientsError })}
                                </p>
                              )}
                              {!ingredientsLoading && !ingredientsError && matches.length === 0 && (
                                <p className="ingredient-picker-status">
                                  {ingredients.length === 0
                                    ? t('addDish.ingredientsEmpty')
                                    : t('addDish.noMatches')}
                                </p>
                              )}
                              {!ingredientsLoading && !ingredientsError && matches.length > 0 && (
                                <ul className="ingredient-options" role="listbox">
                                  {matches.map((ingredient) => {
                                    const added = step.ingredients.some((i) => i.id === ingredient.id)
                                    return (
                                      <li key={ingredient.id}>
                                        <button
                                          type="button"
                                          className="ingredient-option"
                                          disabled={added}
                                          onClick={() => addIngredient(step.id, ingredient)}
                                        >
                                          {ingredient.canonicalName}
                                          {added && (
                                            <span className="ingredient-option-added">{t('addDish.added')}</span>
                                          )}
                                        </button>
                                      </li>
                                    )
                                  })}
                                </ul>
                              )}
                              <button
                                type="button"
                                className="ingredient-create"
                                onClick={() => openCreateDialog(step.id)}
                              >
                                <i className="bi-plus-lg" /> {t('addDish.newIngredient')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
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

            {/* Floats bottom-right on .fab — position: fixed places it against the
                viewport, so it can stay inside the form and keep submitting.
                Only the title is required; the backend allows a null description. */}
            <button type="submit" className="fab add-dish-save" disabled={!title.trim()}>
              {t('addDish.save')}
            </button>
          </form>
        )}
      </div>

      {creatingFor && (
        // Nested inside the outer <form>, so the confirm button stays type="button"
        // — a submit here would try to submit the whole recipe.
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="ingredient-form">
              <div className="add-dish-field">
                <label className="add-dish-label" htmlFor="new-ingredient">
                  {t('addDish.ingredientName')}
                </label>
                <input
                  id="new-ingredient"
                  className="add-dish-input"
                  type="text"
                  value={newName}
                  autoFocus
                  placeholder={t('addDish.ingredientNamePlaceholder')}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={submitOnEnter}
                />
              </div>

              <div className="add-dish-field">
                <label className="add-dish-label" htmlFor="new-ingredient-price">
                  {t('addDish.ingredientPrice')}
                  {currency && <span className="add-dish-label-unit">{currency}</span>}
                </label>
                <input
                  id="new-ingredient-price"
                  className="add-dish-input"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={newPrice}
                  placeholder={t('addDish.ingredientPricePlaceholder')}
                  onChange={(e) => setNewPrice(e.target.value)}
                  onKeyDown={submitOnEnter}
                />
              </div>

              <div className="add-dish-field">
                <label className="add-dish-label" htmlFor="new-ingredient-date">
                  {t('addDish.ingredientLastPurchase')}
                </label>
                {/* A *last* purchase cannot be in the future. Enter belongs to the
                    native picker here, so no submit-on-enter. */}
                <input
                  id="new-ingredient-date"
                  className="add-dish-input"
                  type="date"
                  max={todayIso}
                  value={newLastPurchase}
                  onChange={(e) => setNewLastPurchase(e.target.value)}
                />
              </div>
            </div>
            {createError && <p className="menu-status menu-error">{createError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setCreatingFor(null)}
              >
                {t('addDish.cancel')}
              </button>
              <button
                type="button"
                className="modal-confirm"
                disabled={creating || !newName.trim()}
                onClick={submitNewIngredient}
              >
                {creating ? t('addDish.creating') : t('addDish.create')}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {blocker.state === 'blocked' && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{t('addDish.confirmLeave')}</p>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => blocker.reset()}>{t('addDish.cancel')}</button>
              <button className="modal-confirm" onClick={() => blocker.proceed()}>{t('addDish.leave')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
