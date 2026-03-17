import SearchBar from '../components/SearchBar'
import { suggestions, initialDishes } from '../data'

export default function Home() {
  return (
    <>
      <SearchBar />
      <section className="guess-you-like">
        <h2>Guess you like</h2>
        <div className="guess-grid">
          {suggestions.map((item) => (
            <div className="guess-card" key={item.category}>
              <span className="guess-card-category">{item.category}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
        <button className="guess-refresh" onClick={() => {}}><i className="bi-arrow-clockwise" /> Refresh</button>
      </section>
      <h1>Top Choice</h1>
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
