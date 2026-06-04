import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import SearchBar from '../components/SearchBar'
import { getRecipes } from '../api'

export default function Menu() {
  const { t } = useTranslation()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    getRecipes()
      .then((data) => { if (active) setRecipes(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return (
    <>
      <SearchBar />
      <h1>{t('menu.title')}</h1>
      {loading && <p className="menu-status">{t('menu.loading')}</p>}
      {error && <p className="menu-status menu-error">{t('menu.error', { message: error })}</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className="menu-status">{t('menu.empty')}</p>
      )}
      {!loading && !error && recipes.length > 0 && (
        <div className="menu-grid">
          {recipes.map((recipe) => (
            <div className="dish-card" key={recipe.id}>
              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
