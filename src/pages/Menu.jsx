import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import { getRecipes, setFavorite, setLike, deleteRecipe, addToShoppingList } from '../api'
import ConfirmDialog from '../components/ConfirmDialog'
import DishCover from '../components/DishCover'

// How often to re-read the list while a recipe is still being generated.
// Slower than the detail page's poll: this is a background nudge, not the view
// the user is watching.
const POLL_MS = 5000

export default function Menu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Set by the detail page when it deletes a recipe the AI failed to build.
  const location = useLocation()
  const generationError = location.state?.generationError
  // Each row already carries `favorited`, `liked` and `likeCount`, so the list
  // is the single source of truth — no separate favorites call to cross-reference.
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  // Confirmation after adding a recipe to the shopping list, which otherwise
  // changes nothing visible on this page.
  const [actionNotice, setActionNotice] = useState(null)
  // Id of the card whose row menu is open — only one at a time, so opening a
  // second card's menu closes the first for free.
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)
  // Recipe awaiting delete confirmation; null when the dialog is closed.
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    let active = true
    getRecipes()
      .then((data) => { if (active) setRecipes(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Recipes the AI is still building would otherwise sit at "Generating" until
  // the user reloaded, so the list re-reads itself until none are left. A
  // chained timeout, not an interval, so a slow response cannot stack requests.
  const anyGenerating = recipes.some((recipe) => recipe.status === 'pending')
  useEffect(() => {
    if (!anyGenerating) return
    let timer = null
    let active = true
    function schedule() {
      timer = setTimeout(async () => {
        if (!active) return
        try {
          const data = await getRecipes()
          // No setLoading here — the list is already on screen and only its
          // contents change.
          if (active) setRecipes(data)
        } catch {
          // Keep trying; the effect stops on its own once nothing is pending.
        }
        if (active) schedule()
      }, POLL_MS)
    }
    schedule()
    return () => { active = false; clearTimeout(timer) }
  }, [anyGenerating])

  // Dismiss the row menu on Escape or a click outside it, as the Favorites page does.
  useEffect(() => {
    if (!openMenuId) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpenMenuId(null) }
    const onPointerDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openMenuId])

  // Its own effect: opening the dialog closes the row menu first, so this never
  // competes with the menu's Escape handler.
  useEffect(() => {
    if (!pendingDelete) return
    const onKeyDown = (e) => { if (e.key === 'Escape') setPendingDelete(null) }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [pendingDelete])

  function askDelete(recipe) {
    setOpenMenuId(null)
    setPendingDelete(recipe)
    setDeleteError(null)
  }

  // Waits for the 204 before removing the card, unlike the optimistic like and
  // favorite toggles: a card that vanished and then came back on failure would
  // read as data loss followed by resurrection.
  async function confirmDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteRecipe(pendingDelete.id)
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== pendingDelete.id))
      setPendingDelete(null)
    } catch (err) {
      setDeleteError(t('menu.deleteFailed', { message: err.message }))
    } finally {
      setDeleting(false)
    }
  }

  // The rows carry no "on the list" flag, so this is add-only; the PUT is
  // idempotent, so adding a recipe that is already there is harmless.
  async function addToShopping(recipe) {
    setOpenMenuId(null)
    setActionError(null)
    setActionNotice(null)
    try {
      await addToShoppingList(recipe.id)
      setActionNotice(t('shopping.added', { title: recipe.title }))
    } catch (err) {
      setActionError(
        err.message === 'HTTP 400' ? t('shopping.noIngredientsOnRecipe')
          : t('shopping.addFailed', { message: err.message }),
      )
    }
  }

  function patchRecipe(id, fields) {
    setRecipes((prev) => prev.map((recipe) => (
      recipe.id === id ? { ...recipe, ...fields } : recipe
    )))
  }

  // Both toggles flip straight away and put the old values back if the request
  // fails, as the Favorites page does. Each endpoint takes the desired state
  // rather than toggling, so a double tap lands on the same result.
  async function toggleFavorite(recipe) {
    const next = !recipe.favorited
    setActionError(null)
    patchRecipe(recipe.id, { favorited: next })
    try {
      const result = await setFavorite(recipe.id, next)
      patchRecipe(recipe.id, { favorited: result.favorited })
    } catch (err) {
      patchRecipe(recipe.id, { favorited: recipe.favorited })
      setActionError(t('menu.favoriteFailed', { message: err.message }))
    }
  }

  async function toggleLike(recipe) {
    const next = !recipe.liked
    setActionError(null)
    // The ±1 is only a guess so the number moves with the icon.
    patchRecipe(recipe.id, {
      liked: next,
      likeCount: recipe.likeCount + (next ? 1 : -1),
    })
    try {
      const result = await setLike(recipe.id, next)
      // likeCount is global, so other people's likes may have landed since the
      // list was fetched — the response is authoritative, the guess is not.
      patchRecipe(recipe.id, { liked: result.liked, likeCount: result.likeCount })
    } catch (err) {
      patchRecipe(recipe.id, { liked: recipe.liked, likeCount: recipe.likeCount })
      setActionError(t('menu.likeFailed', { message: err.message }))
    }
  }

  return (
    <>
      <SearchBar />
      <h1>{t('menu.title')}</h1>
      {loading && <p className="menu-status">{t('menu.loading')}</p>}
      {error && <p className="menu-status menu-error">{t('menu.error', { message: error })}</p>}
      {generationError && <p className="menu-status menu-error">{generationError}</p>}
      {actionError && <p className="menu-status menu-error">{actionError}</p>}
      {actionNotice && <p className="menu-status">{actionNotice}</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className="menu-status">{t('menu.empty')}</p>
      )}
      {!loading && !error && recipes.length > 0 && (
        <div className="menu-grid">
          {recipes.map((recipe) => {
            // The AI has not filled this one in yet: its title is a backend
            // placeholder, so the card says what is happening instead. It still
            // opens, onto the detail page's live view of the same generation.
            const pending = recipe.status === 'pending'
            return (
            // The card surface opens the recipe; the title is also a real link
            // so the detail is reachable by keyboard, not only by clicking.
            <div
              className={`dish-card is-clickable${pending ? ' is-generating' : ''}`}
              key={recipe.id}
              onClick={() => navigate(`/recipe/${recipe.id}`)}
            >
              {/* Null while a recipe is still being generated, which is exactly
                  when the placeholder is the honest thing to show. */}
              <DishCover url={recipe.coverUrl} className="dish-cover" />
              <h3>
                <Link className="dish-card-link" to={`/recipe/${recipe.id}`}>
                  {pending ? (
                    <>
                      <span className="spinner" aria-hidden="true" /> {t('menu.generating')}
                    </>
                  ) : recipe.title}
                </Link>
              </h3>
              <p>{pending ? t('menu.generatingHint') : recipe.description}</p>
              {/* Stops the action buttons from also opening the recipe. */}
              <div className="dish-card-actions" onClick={(e) => e.stopPropagation()}>
                {/* Liking or favoriting a half-built recipe means nothing, but
                    deleting one that is stuck does, so the row menu stays. */}
                {!pending && (
                  <>
                <button
                  type="button"
                  className={`dish-action${recipe.liked ? ' is-on' : ''}`}
                  aria-pressed={recipe.liked}
                  aria-label={recipe.liked ? t('menu.unlike') : t('menu.like')}
                  onClick={() => toggleLike(recipe)}
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
                  aria-label={recipe.favorited ? t('menu.unfavorite') : t('menu.favorite')}
                  onClick={() => toggleFavorite(recipe)}
                >
                  <i className={recipe.favorited ? 'bi-star-fill' : 'bi-star'} />
                </button>
                  </>
                )}
                <div
                  className="dish-menu"
                  ref={openMenuId === recipe.id ? menuRef : null}
                >
                  <button
                    type="button"
                    className="dish-action"
                    aria-haspopup="menu"
                    aria-expanded={openMenuId === recipe.id}
                    aria-label={t('menu.rowActions')}
                    onClick={() => setOpenMenuId((id) => (id === recipe.id ? null : recipe.id))}
                  >
                    <i className="bi-three-dots" />
                  </button>
                  {openMenuId === recipe.id && (
                    // Opens upward: the actions sit at the card's bottom edge.
                    <div className="dish-menu-dropdown" role="menu">
                      {!pending && (
                        <button
                          type="button"
                          className="dish-menu-item"
                          role="menuitem"
                          onClick={() => addToShopping(recipe)}
                        >
                          <i className="bi-cart-plus" /> {t('shopping.add')}
                        </button>
                      )}
                      <button
                        type="button"
                        className="dish-menu-item"
                        role="menuitem"
                        onClick={() => askDelete(recipe)}
                      >
                        <i className="bi-trash" /> {t('menu.delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          message={t('menu.confirmDelete', { title: pendingDelete.title })}
          error={deleteError}
          busy={deleting}
          cancelLabel={t('addDish.cancel')}
          confirmLabel={t('menu.delete')}
          busyLabel={t('menu.deleting')}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  )
}
