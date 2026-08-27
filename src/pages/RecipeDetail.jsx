import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getRecipe, setFavorite, setLike, deleteRecipe } from '../api'
import ConfirmDialog from '../components/ConfirmDialog'

// Amounts arrive in two shapes: a numeric amount + unit, or free text like
// "两个". The add form only writes the former, but another client may have
// written the latter, so both render.
function amountLabel(ingredient) {
  if (ingredient.amountText) return ingredient.amountText
  return [ingredient.amount, ingredient.unit].filter(Boolean).join(' ')
}

export default function RecipeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
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

  useEffect(() => {
    if (!lightboxUrl) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setLightboxUrl(null) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [lightboxUrl])

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

  // Clamped, not wrapped: with neighbours peeking in, looping would show the
  // last image to the left of the first, which reads as a bug.
  function step(stepId, images, delta) {
    setImageIndex((prev) => {
      const current = prev[stepId] ?? 0
      return { ...prev, [stepId]: Math.min(Math.max(current + delta, 0), images.length - 1) }
    })
  }

  return (
    <div className="detail-page">
      <Link className="detail-back" to="/menu">
        <i className="bi-arrow-left" /> {t('detail.back')}
      </Link>

      {loading && <p className="menu-status">{t('detail.loading')}</p>}
      {error && <p className="menu-status menu-error">{t('detail.error', { message: error })}</p>}

      {recipe && (
        <article className="detail">
          <header className="detail-header">
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
    </div>
  )
}
