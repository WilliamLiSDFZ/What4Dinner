import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getFavorites, setFavorite } from '../api'

export default function Favorites() {
  const { t } = useTranslation()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  // Id of the row whose menu is open — only one can be open at a time.
  const [openMenuId, setOpenMenuId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    let active = true
    getFavorites()
      .then((data) => { if (active) setFavorites(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // Dismiss the open menu on Escape or a click anywhere outside it.
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

  // Drop the row straight away and put it back if the request fails.
  async function handleUnfavorite(id) {
    const previous = favorites
    setOpenMenuId(null)
    setActionError(null)
    setFavorites((list) => list.filter((recipe) => recipe.id !== id))
    try {
      await setFavorite(id, false)
    } catch (err) {
      setFavorites(previous)
      setActionError(err.message)
    }
  }

  return (
    <>
      <h1>{t('favorites.title')}</h1>
      {loading && <p className="menu-status">{t('favorites.loading')}</p>}
      {error && <p className="menu-status menu-error">{t('favorites.error', { message: error })}</p>}
      {actionError && (
        <p className="menu-status menu-error">
          {t('favorites.unfavoriteFailed', { message: actionError })}
        </p>
      )}
      {!loading && !error && favorites.length === 0 && (
        <p className="menu-status">{t('favorites.empty')}</p>
      )}
      {!loading && !error && favorites.length > 0 && (
        <ul className="favorites-list">
          {favorites.map((recipe, index) => (
            <li className="favorites-item" key={recipe.id}>
              <span className="favorites-rank">{index + 1}</span>
              <div className="favorites-info">
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
              </div>
              <div
                className="favorites-actions"
                ref={openMenuId === recipe.id ? menuRef : null}
              >
                <button
                  className="favorites-dots"
                  aria-haspopup="menu"
                  aria-expanded={openMenuId === recipe.id}
                  aria-label={t('favorites.rowActions')}
                  onClick={() => setOpenMenuId((id) => (id === recipe.id ? null : recipe.id))}
                >
                  <i className="bi-three-dots" />
                </button>
                {openMenuId === recipe.id && (
                  <div className="favorites-menu" role="menu">
                    <button
                      className="favorites-unfavorite"
                      role="menuitem"
                      onClick={() => handleUnfavorite(recipe.id)}
                    >
                      <i className="bi-heartbreak" /> {t('favorites.unfavorite')}
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
