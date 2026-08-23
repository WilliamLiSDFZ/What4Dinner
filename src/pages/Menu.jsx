import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import { getRecipes, getFavorites, setFavorite } from '../api'

export default function Menu() {
  const { t } = useTranslation()
  const [recipes, setRecipes] = useState([])
  // GET /v1/recipe carries no favorited flag, so the state comes from
  // cross-referencing the favorites list by id.
  const [favorited, setFavorited] = useState(new Set())
  // Local only: /v1/like is still a stub controller with no endpoints, so there
  // is nowhere to persist this yet and it resets on reload.
  const [liked, setLiked] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)

  // Promise.all rather than allSettled: both calls hit the same backend with the
  // same token, so one failing alone is not a real scenario, and showing hearts
  // in the wrong state would be worse than the page's error line.
  useEffect(() => {
    let active = true
    Promise.all([getRecipes(), getFavorites()])
      .then(([list, favs]) => {
        if (!active) return
        setRecipes(list)
        setFavorited(new Set(favs.map((favorite) => favorite.id)))
      })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Flip it straight away and put it back if the request fails, as the Favorites
  // page does. setFavorite takes the desired state rather than toggling, so a
  // double tap lands on the same result.
  async function toggleFavorite(id) {
    const next = !favorited.has(id)
    const previous = favorited
    setActionError(null)
    setFavorited((prev) => {
      const updated = new Set(prev)
      if (next) updated.add(id)
      else updated.delete(id)
      return updated
    })
    try {
      await setFavorite(id, next)
    } catch (err) {
      setFavorited(previous)
      setActionError(err.message)
    }
  }

  function toggleLike(id) {
    setLiked((prev) => {
      const updated = new Set(prev)
      if (updated.has(id)) updated.delete(id)
      else updated.add(id)
      return updated
    })
  }

  return (
    <>
      <SearchBar />
      <h1>{t('menu.title')}</h1>
      {loading && <p className="menu-status">{t('menu.loading')}</p>}
      {error && <p className="menu-status menu-error">{t('menu.error', { message: error })}</p>}
      {actionError && (
        <p className="menu-status menu-error">
          {t('menu.favoriteFailed', { message: actionError })}
        </p>
      )}
      {!loading && !error && recipes.length === 0 && (
        <p className="menu-status">{t('menu.empty')}</p>
      )}
      {!loading && !error && recipes.length > 0 && (
        <div className="menu-grid">
          {recipes.map((recipe) => {
            const isLiked = liked.has(recipe.id)
            const isFavorited = favorited.has(recipe.id)
            return (
              <div className="dish-card" key={recipe.id}>
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
                <div className="dish-card-actions">
                  <button
                    type="button"
                    className={`dish-action${isLiked ? ' is-on' : ''}`}
                    aria-pressed={isLiked}
                    aria-label={isLiked ? t('menu.unlike') : t('menu.like')}
                    onClick={() => toggleLike(recipe.id)}
                  >
                    <i className={isLiked ? 'bi-hand-thumbs-up-fill' : 'bi-hand-thumbs-up'} />
                  </button>
                  <button
                    type="button"
                    className={`dish-action${isFavorited ? ' is-on' : ''}`}
                    aria-pressed={isFavorited}
                    aria-label={isFavorited ? t('menu.unfavorite') : t('menu.favorite')}
                    onClick={() => toggleFavorite(recipe.id)}
                  >
                    <i className={isFavorited ? 'bi-heart-fill' : 'bi-heart'} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
