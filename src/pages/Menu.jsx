import SearchBar from '../components/SearchBar'
import { initialDishes } from '../data'

export default function Menu() {
  return (
    <>
      <SearchBar />
      <h1>My Menu</h1>
      <div className="menu-grid">
        {initialDishes.map((dish) => (
          <div className="dish-card" key={dish.id}>
            <h3>{dish.name}</h3>
            <p>{dish.description}</p>
          </div>
        ))}
      </div>
    </>
  )
}
