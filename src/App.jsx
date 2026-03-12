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
  { key: 'home', label: 'Home', icon: 'bi-house-door' },
  { key: 'menu', label: 'My Menu', icon: 'bi-book' },
  { key: 'favorites', label: 'Favorites', icon: 'bi-heart' },
  { key: 'shopping', label: 'Shopping List', icon: 'bi-cart' },
  { key: 'family', label: 'My Family', icon: 'bi-people' },
  { key: 'settings', label: 'Settings', icon: 'bi-gear' },
]

const familyMembers = [
  { name: 'Alice', initial: 'A' },
  { name: 'Bob', initial: 'B' },
  { name: 'Charlie', initial: 'C' },
]

function SearchBar() {
  return (
    <div className="search-wrapper">
      <i className="bi-search" />
      <input
        className="search-bar"
        type="text"
        placeholder="Search dishes..."
      />
    </div>
  )
}

function App() {
  const [dishes] = useState(initialDishes)
  const [page, setPage] = useState('home')

  return (
    <>
      <aside className="sidebar">
        <p className="sidebar-brand">What4Dinner</p>
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li key={item.key}>
              <a
                href="#"
                className={page === item.key ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setPage(item.key) }}
              >
                <i className={item.icon} /> {item.label}
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
              <button className="guess-refresh" onClick={() => {}}><i className="bi-arrow-clockwise" /> Refresh</button>
            </section>
            <h1>Top Choice</h1>
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
        {page === 'family' && (
          <>
            <h1>My Family</h1>
            <div className="family-grid">
              {familyMembers.map((member) => (
                <div className="family-card" key={member.name}>
                  <div className="family-avatar">{member.initial}</div>
                  <span className="family-name">{member.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
        {page !== 'home' && page !== 'menu' && page !== 'family' && (
          <h1>{navItems.find((item) => item.key === page)?.label}</h1>
        )}
      </main>
    </>
  )
}

export default App
