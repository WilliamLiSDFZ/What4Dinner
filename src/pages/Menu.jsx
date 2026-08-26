import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import { getRecipes, setFavorite, setLike, deleteRecipe } from '../api'

export default function Menu() {
  const { t } = useTranslation()
  // Each row already carries `favorited`, `liked` and `likeCount`, so the list
  // is the single source of truth — no separate favorites call to cross-reference.
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
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
      {actionError && <p className="menu-status menu-error">{actionError}</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className="menu-status">{t('menu.empty')}</p>
      )}
      {!loading && !error && recipes.length > 0 && (
        <div className="menu-grid">
          {recipes.map((recipe) => (
            <div className="dish-card" key={recipe.id}>
              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>
              <div className="dish-card-actions">
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
          ))}
        </div>
      )}

      {pendingDelete && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{t('menu.confirmDelete', { title: pendingDelete.title })}</p>
            {deleteError && <p className="menu-status menu-error">{deleteError}</p>}
            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel"
                disabled={deleting}
                onClick={() => setPendingDelete(null)}
              >
                {t('addDish.cancel')}
              </button>
              {/* Both disabled in flight so a double-click cannot fire two deletes. */}
              <button
                type="button"
                className="modal-confirm"
                disabled={deleting}
                onClick={confirmDelete}
              >
                {deleting ? t('menu.deleting') : t('menu.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
