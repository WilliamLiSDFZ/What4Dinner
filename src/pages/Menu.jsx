import { useState, useEffect } from 'react'
import SearchBar from '../components/SearchBar'
import { getRecipes } from '../api'

export default function Menu() {
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
      <h1>My Menu</h1>
      {loading && <p className="menu-status">Loading recipes…</p>}
      {error && <p className="menu-status menu-error">Couldn't load recipes: {error}</p>}
      {!loading && !error && recipes.length === 0 && (
        <p className="menu-status">No recipes yet.</p>
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
