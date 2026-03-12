import { useState } from 'react'
import './App.css'

const suggestions = [
  { category: 'Meat Dish', name: 'Braised Short Ribs', description: 'Tender beef short ribs slow-braised in red wine and herbs.' },
  { category: 'Vegetable Dish', name: 'Roasted Cauliflower', description: 'Crispy roasted cauliflower with tahini drizzle and pomegranate.' },
  { category: 'Soup', name: 'Tomato Basil Soup', description: 'Classic creamy tomato soup with fresh basil and croutons.' },
  { category: 'Drink', name: 'Mango Lassi', description: 'Chilled yogurt smoothie blended with ripe mango and cardamom.' },
]

const initialDishes = [
  { id: 1, name: 'Pasta Carbonara', description: 'Creamy Italian pasta with pancetta, egg, and parmesan.' },
  { id: 2, name: 'Chicken Stir Fry', description: 'Quick veggie and chicken stir fry with soy-ginger sauce.' },
  { id: 3, name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, basil, and tomato.' },
  { id: 4, name: 'Beef Tacos', description: 'Seasoned ground beef tacos with salsa, cheese, and cilantro.' },
  { id: 5, name: 'Greek Salad', description: 'Cucumber, tomato, olives, and feta with lemon dressing.' },
  { id: 6, name: 'Salmon Teriyaki', description: 'Pan-seared salmon glazed with homemade teriyaki sauce.' },
  { id: 7, name: 'Vegetable Curry', description: 'Hearty coconut curry loaded with seasonal vegetables.' },
  { id: 8, name: 'Mushroom Risotto', description: 'Creamy arborio rice with mixed mushrooms and parmesan.' },
]

const navItems = [
  { key: 'home', label: 'Home' },
  { key: 'menu', label: 'My Menu' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'shopping', label: 'Shopping List' },
  { key: 'settings', label: 'Settings' },
]

function SearchBar() {
  return (
    <input
      className="search-bar"
      type="text"
      placeholder="Search dishes..."
    />
  )
}

function App() {
  const [dishes] = useState(initialDishes)
  const [page, setPage] = useState('home')

  return (
    <>
      <aside className="sidebar">
        <p className="sidebar-brand">what4dinner</p>
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.key}>
              <a
                href="#"
                className={page === item.key ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setPage(item.key) }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="sidebar-user">
          <div className="sidebar-avatar">W</div>
          <span className="sidebar-user-name">William</span>
        </div>
      </aside>

      <main className="main-content">
        {page === 'home' && (
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
              <button className="guess-refresh" onClick={() => {}}>Refresh</button>
            </section>
            <h1>My Menu</h1>
            <div className="menu-grid">
              {dishes.map((dish) => (
                <div className="dish-card" key={dish.id}>
                  <h3>{dish.name}</h3>
                  <p>{dish.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {page === 'menu' && (
          <>
            <SearchBar />
            <h1>My Menu</h1>
            <div className="menu-grid">
              {dishes.map((dish) => (
                <div className="dish-card" key={dish.id}>
                  <h3>{dish.name}</h3>
                  <p>{dish.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {page !== 'home' && page !== 'menu' && (
          <h1>{navItems.find((item) => item.key === page)?.label}</h1>
        )}
      </main>
    </>
  )
}

export default App
