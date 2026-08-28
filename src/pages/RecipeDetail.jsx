import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ACCEPTED_IMAGE_TYPES,
  getRecipe,
  setFavorite,
  setLike,
  deleteRecipe,
  getGenerationTask,
  getUploadUrl,
  uploadToSignedUrl,
  addRecipeImages,
} from '../api'
import ConfirmDialog from '../components/ConfirmDialog'

// Amounts arrive in two shapes: a numeric amount + unit, or free text like
// "两个". The add form only writes the former, but another client may have
// written the latter, so both render.
// How often to re-read a recipe the AI is still building, and how long to keep
// at it. Five minutes is well past a normal generation; past that the page says
// so rather than polling a stuck task forever.
const POLL_MS = 3000
const POLL_LIMIT_MS = 5 * 60 * 1000

function amountLabel(ingredient) {
  if (ingredient.amountText) return ingredient.amountText
  return [ingredient.amount, ingredient.unit].filter(Boolean).join(' ')
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Set when arriving straight from the add form. Only used to explain a
  // failure — progress itself is followed through the recipe's own status.
  const [searchParams] = useSearchParams()
  const taskId = searchParams.get('task')
  const { t } = useTranslation()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  // One carousel position per step, keyed by step id.
  const [imageIndex, setImageIndex] = useState({})
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  // Carousel position for the recipe's own photos, separate from the per-step one.
  const [photoIndex, setPhotoIndex] = useState(0)
  // Previews for a batch of photos still uploading, as
  // { id, file, url, uploading, failed }. Their urls are object URLs, revoked
  // once the server's signed URLs take over.
  const [pending, setPending] = useState([])
  const [photoError, setPhotoError] = useState(null)
  const photoInput = useRef(null)
  // Flipped once polling has run past POLL_LIMIT_MS, so the copy can stop
  // promising the recipe is about to appear.
  const [pollGaveUp, setPollGaveUp] = useState(false)

  const generating = recipe?.status === 'pending'

  // Attached photos first, then the previews. The endpoint appends by
  // displayOrder, so a preview lands at the position it already occupied and the
  // carousel does not jump when the swap happens.
  const photos = [
    ...(recipe?.images ?? []).map((image) => ({ key: image.id, url: image.url })),
    ...pending.map((image) => ({
      key: image.id,
      url: image.url,
      uploading: image.uploading,
      failed: image.failed,
    })),
  ]
  const photoAt = Math.min(photoIndex, Math.max(photos.length - 1, 0))

  // Image URLs are signed and expire in ~15 minutes, so they are fetched on
  // mount and never cached anywhere longer-lived.
  // `loading` starts true rather than being reset here, matching the other
  // pages. That is sound because the only route to a different recipe is via
  // the menu, which unmounts this page — add a reset if recipe-to-recipe links
  // ever let `id` change in place.
  useEffect(() => {
    let active = true
    getRecipe(id)
      .then((data) => { if (active) setRecipe(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  // While the AI is still building this recipe, re-read it on a timer. The recipe
  // is polled rather than the generation task because it works from every entry
  // point — a fresh navigation, a reload, or opening the card from My Menu later,
  // none of which carry a task id — and because the read that first sees `done`
  // *is* the finished recipe, so there is no second round trip and no race.
  // A chained timeout rather than an interval: a slow response delays the next
  // request instead of stacking another on top of it.
  useEffect(() => {
    if (!generating || pollGaveUp) return
    let timer = null
    let active = true
    const startedAt = Date.now()

    function schedule() {
      timer = setTimeout(async () => {
        if (!active) return
        if (Date.now() - startedAt > POLL_LIMIT_MS) {
          setPollGaveUp(true)
          return
        }
        try {
          const data = await getRecipe(id)
          if (!active) return
          // Never re-raise `loading` here: it would flash the loading line on
          // every tick. Only the recipe itself is replaced.
          setRecipe(data)
          if (data.status === 'pending') schedule()
        } catch {
          // A transient failure mid-generation is not worth tearing the page
          // down for — keep trying until the time limit runs out.
          if (active) schedule()
        }
      }, POLL_MS)
    }
    schedule()
    return () => { active = false; clearTimeout(timer) }
  }, [id, generating, pollGaveUp])

  // A failed generation leaves an empty recipe behind that is of no use to
  // anyone, so it is removed and the reason carried back to the menu. The recipe
  // row records *that* it failed but not why, so the task — when we have one —
  // is what supplies the message.
  useEffect(() => {
    if (recipe?.status !== 'failed') return
    let active = true
    ;(async () => {
      let message = null
      if (taskId) {
        try {
          const task = await getGenerationTask(taskId)
          message = task.errorMessage
        } catch {
          // The task may have expired or the store may be down; the deletion
          // below still matters, so fall back to the reasonless wording.
          message = null
        }
      }
      try {
        await deleteRecipe(recipe.id)
      } catch (err) {
        // Better to strand the user on a page that explains itself than to
        // bounce them to the menu having silently failed to clean up.
        if (active) setError(t('menu.deleteFailed', { message: err.message }))
        return
      }
      if (!active) return
      navigate('/menu', {
        replace: true,
        state: {
          generationError: message
            ? t('menu.generationFailed', { message })
            : t('menu.generationFailedNoReason'),
        },
      })
    })()
    return () => { active = false }
  }, [recipe, taskId, navigate, t])

  useEffect(() => {
    if (!lightboxUrl) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setLightboxUrl(null) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [lightboxUrl])

  // An unmount cleanup with [] deps closes over the first render's previews, so
  // the live list is mirrored into a ref for it — the same arrangement the add
  // form uses for its step images.
  const pendingRef = useRef(pending)
  useEffect(() => { pendingRef.current = pending }, [pending])
  useEffect(() => () => {
    pendingRef.current.forEach((image) => URL.revokeObjectURL(image.url))
  }, [])

  // Same optimistic-with-rollback handling as the menu cards; the detail
  // payload carries liked / favorited / likeCount in the same shape.
  async function toggleFavorite() {
    const next = !recipe.favorited
    const previous = recipe.favorited
    setActionError(null)
    setRecipe((prev) => ({ ...prev, favorited: next }))
    try {
      const result = await setFavorite(recipe.id, next)
      setRecipe((prev) => ({ ...prev, favorited: result.favorited }))
    } catch (err) {
      setRecipe((prev) => ({ ...prev, favorited: previous }))
      setActionError(t('menu.favoriteFailed', { message: err.message }))
    }
  }

  async function toggleLike() {
    const next = !recipe.liked
    const previous = { liked: recipe.liked, likeCount: recipe.likeCount }
    setActionError(null)
    setRecipe((prev) => ({
      ...prev,
      liked: next,
      likeCount: prev.likeCount + (next ? 1 : -1),
    }))
    try {
      // likeCount is global, so the response is authoritative over the ±1 guess.
      const result = await setLike(recipe.id, next)
      setRecipe((prev) => ({ ...prev, liked: result.liked, likeCount: result.likeCount }))
    } catch (err) {
      setRecipe((prev) => ({ ...prev, ...previous }))
      setActionError(t('menu.likeFailed', { message: err.message }))
    }
  }

  async function confirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteRecipe(recipe.id)
      navigate('/menu')
    } catch (err) {
      setDeleteError(t('menu.deleteFailed', { message: err.message }))
      setDeleting(false)
    }
  }

  // Object URLs and ids are minted out here rather than inside the updater,
  // which StrictMode double-invokes — a discarded first set would leak.
  function addPhotos(fileList) {
    const added = [...fileList]
      .filter((file) => ACCEPTED_IMAGE_TYPES.includes(file.type))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        uploading: true,
        failed: false,
      }))
    if (added.length === 0) return
    setPhotoError(null)
    // Show the previews at once, pointing the carousel at the first of them.
    setPhotoIndex(photos.length)
    setPending((prev) => [...prev, ...added])
    // The cover can only be chosen while uploading — there is no endpoint to
    // change one later — so the first photo a recipe ever gets becomes it and
    // every later batch merely appends. Decided here, before the uploads start,
    // so a batch already in flight is counted as having claimed it.
    uploadPhotos(added, photos.length === 0 ? 0 : null)
  }

  // One PUT per file straight to GCS, then a single attach call: the endpoint
  // takes the whole batch, so the keys keep their pick order in displayOrder and
  // the cover is decided once. A batch is all-or-nothing — if one file fails,
  // nothing is attached, rather than leaving the user to guess which landed.
  async function uploadPhotos(batch, primaryIndex) {
    let keys
    try {
      keys = await Promise.all(batch.map(async (image) => {
        const target = await getUploadUrl('recipe', image.file.type)
        await uploadToSignedUrl(target, image.file)
        return target.objectName
      }))
    } catch (err) {
      failPhotos(batch, err)
      return
    }
    try {
      const images = await addRecipeImages(recipe.id, keys, primaryIndex)
      // The response is the recipe's whole image list, so it replaces the local
      // one instead of being merged into it.
      setRecipe((prev) => ({ ...prev, images }))
      const ids = new Set(batch.map((image) => image.id))
      setPending((prev) => prev.filter((image) => !ids.has(image.id)))
      batch.forEach((image) => URL.revokeObjectURL(image.url))
    } catch (err) {
      failPhotos(batch, err)
    }
  }

  function failPhotos(batch, err) {
    const ids = new Set(batch.map((image) => image.id))
    setPending((prev) => prev.map((image) => (
      ids.has(image.id) ? { ...image, uploading: false, failed: true } : image
    )))
    setPhotoError(t('detail.photoFailed', { message: err.message }))
  }

  // Only failed previews can be dismissed: they were never attached, so nothing
  // is lost. Photos the server accepted have no remove button because the API
  // offers no way to detach one.
  function dismissPhoto(id) {
    const going = pending.find((image) => image.id === id)
    if (going) URL.revokeObjectURL(going.url)
    const remaining = pending.filter((image) => image.id !== id)
    setPending(remaining)
    // Clamp the index itself, not just where it is read: left stale it would
    // spend the next Previous click coming back into range instead of moving.
    const total = (recipe.images?.length ?? 0) + remaining.length
    setPhotoIndex((prev) => Math.min(prev, Math.max(total - 1, 0)))
    // Once the last failure is gone the message has nothing left to point at.
    if (!remaining.some((image) => image.failed)) setPhotoError(null)
  }

  function movePhoto(delta) {
    setPhotoIndex((prev) => Math.min(Math.max(prev + delta, 0), photos.length - 1))
  }

  // Clamped, not wrapped: with neighbours peeking in, looping would show the
  // last image to the left of the first, which reads as a bug.
  function step(stepId, images, delta) {
    setImageIndex((prev) => {
      const current = prev[stepId] ?? 0
      return { ...prev, [stepId]: Math.min(Math.max(current + delta, 0), images.length - 1) }
    })
  }

  return (
    <>
      {/* Outside the centred column, so it sits at the page's top-left corner —
          the same relationship /add has between Return and its form. */}
      <Link className="detail-back" to="/menu">
        <i className="bi-arrow-left" /> {t('detail.back')}
      </Link>

      <div className="detail-page">
      {loading && <p className="menu-status">{t('detail.loading')}</p>}
      {error && <p className="menu-status menu-error">{t('detail.error', { message: error })}</p>}

      {/* The whole article is replaced while the AI works: at this point the
          recipe is a placeholder title and no steps, so there is nothing worth
          rendering behind the spinner. A `failed` recipe falls through to
          nothing, because the effect above is already deleting it and leaving. */}
      {generating && (
        <div className="detail-generating">
          <span className="spinner" aria-hidden="true" />
          <h2>{t('detail.generatingTitle')}</h2>
          <p>{pollGaveUp ? t('detail.generatingSlow') : t('detail.generatingHint')}</p>
        </div>
      )}

      {recipe && !generating && recipe.status !== 'failed' && (
        <article className="detail">
          <header className="detail-header">
            <div className="detail-header-text">
            <h1>{recipe.title}</h1>
            {recipe.description && <p className="detail-description">{recipe.description}</p>}
            <div className="detail-meta">
              {recipe.prepTimeMinutes != null && (
                <span className="detail-chip">
                  <i className="bi-clock" />{' '}
                  {t('detail.prepTime')} {t('detail.minutes', { count: recipe.prepTimeMinutes })}
                </span>
              )}
              {recipe.cookTimeMinutes != null && (
                <span className="detail-chip">
                  <i className="bi-fire" />{' '}
                  {t('detail.cookTime')} {t('detail.minutes', { count: recipe.cookTimeMinutes })}
                </span>
              )}
            </div>
            <div className="detail-actions">
              <button
                type="button"
                className={`dish-action${recipe.liked ? ' is-on' : ''}`}
                aria-pressed={recipe.liked}
                aria-label={recipe.liked ? t('detail.unlike') : t('detail.like')}
                onClick={toggleLike}
              >
                <i className={recipe.liked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} />
                {recipe.likeCount > 0 && (
                  <span className="dish-action-count">{recipe.likeCount}</span>
                )}
              </button>
              <button
                type="button"
                className={`dish-action${recipe.favorited ? ' is-on' : ''}`}
                aria-pressed={recipe.favorited}
                aria-label={recipe.favorited ? t('detail.unfavorite') : t('detail.favorite')}
                onClick={toggleFavorite}
              >
                <i className={recipe.favorited ? 'bi-star-fill' : 'bi-star'} />
              </button>
              <button
                type="button"
                className="dish-action"
                aria-label={t('menu.delete')}
                onClick={() => { setConfirmingDelete(true); setDeleteError(null) }}
              >
                <i className="bi-trash" />
              </button>
            </div>
            {actionError && <p className="menu-status menu-error">{actionError}</p>}
            </div>

            <div className="detail-header-media">
              {photos.length === 0 ? (
                <button
                  type="button"
                  className="detail-upload"
                  aria-label={t('detail.addPhoto')}
                  onClick={() => photoInput.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); addPhotos(e.dataTransfer.files) }}
                >
                  <i className="bi-plus-lg" />
                </button>
              ) : (
                <>
                  {/* The same coverflow the steps use, so the two carousels on
                      the page read as one component. */}
                  <div className="detail-carousel">
                    <div className="detail-carousel-stage">
                      {photos.map((photo, i) => {
                        const offset = i - photoAt
                        const distance = Math.abs(offset)
                        return (
                          <div
                            key={photo.key}
                            className={`detail-slide${distance === 0 ? ' is-current' : distance === 1 ? ' is-peek' : ''}`}
                            style={{ '--offset': offset }}
                            aria-hidden={distance !== 0}
                          >
                            {distance === 0 ? (
                              <button
                                type="button"
                                className="detail-slide-open"
                                aria-label={t('addDish.enlargePhoto')}
                                onClick={() => setLightboxUrl(photo.url)}
                              >
                                <img src={photo.url} alt="" />
                              </button>
                            ) : (
                              <img src={photo.url} alt="" />
                            )}
                            {/* Inside the slide, not the stage: the slide is the
                                positioned box, so the badge lands on the photo
                                rather than in the stage's empty margin. */}
                            {distance === 0 && (photo.uploading || photo.failed) && (
                              <span className="step-image-badge">
                                {photo.uploading ? t('addDish.uploading') : t('addDish.uploadFailed')}
                              </span>
                            )}
                            {distance === 0 && photo.failed && (
                              <button
                                type="button"
                                className="add-dish-thumb-remove"
                                aria-label={t('addDish.removePhoto')}
                                onClick={() => dismissPhoto(photo.key)}
                              >
                                <i className="bi-x-lg" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      className="step-carousel-nav is-prev"
                      aria-label={t('addDish.prevPhoto')}
                      disabled={photoAt === 0}
                      onClick={() => movePhoto(-1)}
                    >
                      <i className="bi-chevron-left" />
                    </button>
                    <button
                      type="button"
                      className="step-carousel-nav is-next"
                      aria-label={t('addDish.nextPhoto')}
                      disabled={photoAt === photos.length - 1}
                      onClick={() => movePhoto(1)}
                    >
                      <i className="bi-chevron-right" />
                    </button>
                    <span className="step-carousel-count">
                      {photoAt + 1} / {photos.length}
                    </span>
                  </div>
                  {/* Outside .detail-carousel, whose height the absolutely
                      positioned count is measured against. */}
                  <button
                    type="button"
                    className="step-add-image"
                    onClick={() => photoInput.current?.click()}
                  >
                    <i className="bi-plus-lg" /> {t('detail.addPhoto')}
                  </button>
                </>
              )}
              {photoError && <p className="menu-status menu-error">{photoError}</p>}
              <input
                ref={photoInput}
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(',')}
                multiple
                hidden
                onChange={(e) => { addPhotos(e.target.files); e.target.value = '' }}
              />
            </div>
          </header>

          <h2 className="detail-steps-title">{t('detail.steps')}</h2>
          {recipe.steps.length === 0 && <p className="menu-status">{t('detail.noSteps')}</p>}
          <ol className="detail-steps">
            {recipe.steps.map((s) => {
              const index = imageIndex[s.id] ?? 0
              return (
                <li className="detail-step" key={s.id}>
                  <div className="detail-step-index">
                    <span className="step-number">{s.stepOrder}</span>
                  </div>
                  <div className="detail-step-body">
                    <div className="detail-step-text">
                    {s.isOptional && (
                      <span className="detail-optional">{t('detail.optionalStep')}</span>
                    )}
                    {s.instruction && <p className="detail-instruction">{s.instruction}</p>}
                    {s.ingredients.length > 0 && (
                      <div className="step-ingredients">
                        {s.ingredients.map((ingredient) => {
                          const label = amountLabel(ingredient)
                          return (
                            <span
                              className={`ingredient-pill is-static${ingredient.isOptional ? ' is-optional' : ''}`}
                              key={ingredient.ingredientId}
                            >
                              {label && <span className="ingredient-pill-qty">{label}</span>}
                              {ingredient.name}
                              {ingredient.prepNote && (
                                <span className="detail-prep-note">{ingredient.prepNote}</span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    </div>
                    {s.images.length > 0 && (
                      <div className="detail-step-media">
                        <div className="detail-carousel">
                          <div className="detail-carousel-stage">
                            {s.images.map((url, i) => {
                              const offset = i - index
                              const distance = Math.abs(offset)
                              // Only the centre slide is interactive; the peeks are
                              // decorative, so they are hidden from assistive tech
                              // and take no pointer events.
                              return (
                                <div
                                  key={url}
                                  className={`detail-slide${distance === 0 ? ' is-current' : distance === 1 ? ' is-peek' : ''}`}
                                  style={{ '--offset': offset }}
                                  aria-hidden={distance !== 0}
                                >
                                  {distance === 0 ? (
                                    <button
                                      type="button"
                                      className="detail-slide-open"
                                      aria-label={t('addDish.enlargePhoto')}
                                      onClick={() => setLightboxUrl(url)}
                                    >
                                      <img src={url} alt="" />
                                    </button>
                                  ) : (
                                    <img src={url} alt="" />
                                  )}
                                </div>
                              )
                            })}
                          </div>
                          <button
                            type="button"
                            className="step-carousel-nav is-prev"
                            aria-label={t('addDish.prevPhoto')}
                            disabled={index === 0}
                            onClick={() => step(s.id, s.images, -1)}
                          >
                            <i className="bi-chevron-left" />
                          </button>
                          <button
                            type="button"
                            className="step-carousel-nav is-next"
                            aria-label={t('addDish.nextPhoto')}
                            disabled={index === s.images.length - 1}
                            onClick={() => step(s.id, s.images, 1)}
                          >
                            <i className="bi-chevron-right" />
                          </button>
                          <span className="step-carousel-count">
                            {index + 1} / {s.images.length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </article>
      )}

      </div>

      {confirmingDelete && recipe && (
        <ConfirmDialog
          message={t('menu.confirmDelete', { title: recipe.title })}
          error={deleteError}
          busy={deleting}
          cancelLabel={t('addDish.cancel')}
          confirmLabel={t('menu.delete')}
          busyLabel={t('menu.deleting')}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={confirmDelete}
        />
      )}

      {lightboxUrl && (
        <div className="modal-overlay is-lightbox" onClick={() => setLightboxUrl(null)}>
          <img
            className="lightbox-image"
            src={lightboxUrl}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
