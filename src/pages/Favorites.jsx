import { favoriteDishes } from '../data'

export default function Favorites() {
  return (
    <>
      <h1>Favorites</h1>
      <ul className="favorites-list">
        {favoriteDishes.map((dish) => (
          <li className="favorites-item" key={dish.rank}>
            <span className="favorites-rank">{dish.rank}</span>
            <div className="favorites-info">
              <h3>{dish.name}</h3>
              <p>{dish.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
