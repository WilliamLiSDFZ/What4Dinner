import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import { getRecipes, setFavorite, setLike } from '../api'

export default function Menu() {
  const { t } = useTranslation()
  // Each row already carries `favorited`, `liked` and `likeCount`, so the list
  // is the single source of truth — no separate favorites call to cross-reference.
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    let active = true
    getRecipes()
      .then((data) => { if (active) setRecipes(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

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
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
