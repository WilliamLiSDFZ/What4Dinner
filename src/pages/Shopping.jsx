import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getShoppingList, removeFromShoppingList, setIngredientChecked } from '../api'
import DishCover from '../components/DishCover'
import ConfirmDialog from '../components/ConfirmDialog'

const EMPTY_LIST = { recipes: [], ingredients: [] }

export default function Shopping() {
  const { t } = useTranslation()
  const [list, setList] = useState(EMPTY_LIST)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  // Id of the recipe whose removal is in flight, so its button can't fire twice.
  const [removingId, setRemovingId] = useState(null)
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState(null)

  useEffect(() => {
    let active = true
    getShoppingList()
      .then((data) => { if (active) setList(data) })
      .catch((err) => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // The per-recipe ingredient rows carry no checked state; the de-duplicated
  // top-level list owns it, so the dish cards look it up here.
  const checkedById = new Map(list.ingredients.map((ing) => [ing.ingredientId, ing.checked]))

  function patchIngredient(id, checked) {
    setList((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing) => (
        ing.ingredientId === id ? { ...ing, checked } : ing
      )),
    }))
  }

  // Optimistic with rollback, like the favorite and like toggles. The endpoint
  // takes the desired state, so a double tap lands on the same result.
  async function toggleIngredient(ing) {
    const next = !ing.checked
    setActionError(null)
    patchIngredient(ing.ingredientId, next)
    try {
      const result = await setIngredientChecked(ing.ingredientId, next)
      patchIngredient(ing.ingredientId, result.checked)
    } catch (err) {
      patchIngredient(ing.ingredientId, ing.checked)
      setActionError(t('shopping.checkFailed', { message: err.message }))
    }
  }

  // Removals wait for the 204 and then re-read the list rather than filtering
  // locally: dropping a recipe can drop ingredients or flip their checked state
  // (checked means "checked for every recipe using it"), which only the server
  // can recompute.
  async function removeRecipe(recipe) {
    setRemovingId(recipe.id)
    setActionError(null)
    try {
      await removeFromShoppingList(recipe.id)
      setList(await getShoppingList())
    } catch (err) {
      setActionError(t('shopping.removeFailed', { message: err.message }))
    } finally {
      setRemovingId(null)
    }
  }

  // There is no bulk endpoint, so Clear removes each recipe in turn. allSettled
  // rather than all: a partial failure still re-reads the list, so what is left
  // on screen is exactly what is left on the server.
  async function confirmClear() {
    setClearing(true)
    setClearError(null)
    const results = await Promise.allSettled(
      list.recipes.map((recipe) => removeFromShoppingList(recipe.id)),
    )
    const failed = results.find((r) => r.status === 'rejected')
    try {
      setList(await getShoppingList())
      if (failed) throw failed.reason
      setConfirmingClear(false)
    } catch (err) {
      setClearError(t('shopping.clearFailed', { message: err.message }))
    } finally {
      setClearing(false)
    }
  }

  return (
    <>
      <div className="shopping-header">
        <h1>{t('shopping.title')}</h1>
        <button
          className="shopping-clear"
          disabled={list.recipes.length === 0}
          onClick={() => { setConfirmingClear(true); setClearError(null) }}
        >
          <i className="bi-trash" /> {t('shopping.clear')}
        </button>
      </div>
      {loading && <p className="menu-status">{t('shopping.loading')}</p>}
      {error && <p className="menu-status menu-error">{t('shopping.error', { message: error })}</p>}
      {actionError && <p className="menu-status menu-error">{actionError}</p>}
      {!loading && !error && (
        <div className="shopping-layout">
          <div className="shopping-ingredients">
            <h2>{t('shopping.ingredients')}</h2>
            {list.ingredients.length === 0 ? (
              <p className="menu-status">{t('shopping.noIngredients')}</p>
            ) : (
              <ul className="shopping-list">
                {list.ingredients.map((ing) => (
                  <li key={ing.ingredientId} className={ing.checked ? 'is-checked' : undefined}>
                    <label>
                      <input
                        type="checkbox"
                        checked={ing.checked}
                        onChange={() => toggleIngredient(ing)}
                      />
                      {ing.name}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="shopping-dishes">
            <h2>{t('shopping.dishes')}</h2>
            {list.recipes.length === 0 ? (
              <p className="menu-status">{t('shopping.noDishes')}</p>
            ) : (
              list.recipes.map((recipe) => (
                <div className="shopping-dish" key={recipe.id}>
                  <div className="shopping-dish-header">
                    <DishCover url={recipe.coverUrl} className="favorites-thumb" />
                    <h3>
                      <Link className="dish-card-link" to={`/recipe/${recipe.id}`}>{recipe.title}</Link>
                    </h3>
                    <button
                      type="button"
                      className="dish-action"
                      aria-label={t('shopping.remove', { title: recipe.title })}
                      disabled={removingId === recipe.id}
                      onClick={() => removeRecipe(recipe)}
                    >
                      <i className="bi-x-lg" />
                    </button>
                  </div>
                  <ul>
                    {recipe.ingredients.map((ing) => (
                      <li
                        key={ing.ingredientId}
                        className={checkedById.get(ing.ingredientId) ? 'is-checked' : undefined}
                      >
                        {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {confirmingClear && (
        <ConfirmDialog
          message={t('shopping.confirmClear')}
          error={clearError}
          busy={clearing}
          cancelLabel={t('addDish.cancel')}
          confirmLabel={t('shopping.clear')}
          busyLabel={t('shopping.clearing')}
          onCancel={() => setConfirmingClear(false)}
          onConfirm={confirmClear}
        />
      )}
    </>
  )
}
