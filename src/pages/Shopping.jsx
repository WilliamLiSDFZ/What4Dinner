import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { initialDishes } from '../data'

export default function Shopping() {
  const { t } = useTranslation()
  // Dishes are the single source of truth: the ingredient column is derived from
  // them, so clearing the dishes empties both columns without keeping two lists
  // in step. Seeded from static data until /v1/shopping-list exists.
  const [dishes, setDishes] = useState(initialDishes)
  const allIngredients = [...new Set(dishes.flatMap((d) => d.ingredients))].sort()

  return (
    <>
      <div className="shopping-header">
        <h1>{t('shopping.title')}</h1>
        <button
          className="shopping-clear"
          disabled={dishes.length === 0}
          onClick={() => setDishes([])}
        >
          <i className="bi-trash" /> {t('shopping.clear')}
        </button>
      </div>
      <div className="shopping-layout">
        <div className="shopping-ingredients">
          <h2>{t('shopping.ingredients')}</h2>
          {allIngredients.length === 0 ? (
            <p className="menu-status">{t('shopping.noIngredients')}</p>
          ) : (
            <ul className="shopping-list">
              {allIngredients.map((item) => (
                <li key={item}><input type="checkbox" />{item}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="shopping-dishes">
          <h2>{t('shopping.dishes')}</h2>
          {dishes.length === 0 ? (
            <p className="menu-status">{t('shopping.noDishes')}</p>
          ) : (
            dishes.map((dish) => (
              <div className="shopping-dish" key={dish.id}>
                <h3>{dish.name}</h3>
                <ul>
                  {dish.ingredients.map((ing) => (
                    <li key={ing}>{ing}</li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
