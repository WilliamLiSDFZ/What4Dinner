import { initialDishes } from '../data'

export default function Shopping() {
  const allIngredients = [...new Set(initialDishes.flatMap((d) => d.ingredients))].sort()

  return (
    <>
      <h1>Shopping List</h1>
      <div className="shopping-layout">
        <div className="shopping-ingredients">
          <h2>Ingredients</h2>
          <ul className="shopping-list">
            {allIngredients.map((item) => (
              <li key={item}><input type="checkbox" />{item}</li>
            ))}
          </ul>
        </div>
        <div className="shopping-dishes">
          <h2>Dishes</h2>
          {initialDishes.map((dish) => (
            <div className="shopping-dish" key={dish.id}>
              <h3>{dish.name}</h3>
              <ul>
                {dish.ingredients.map((ing) => (
                  <li key={ing}>{ing}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
