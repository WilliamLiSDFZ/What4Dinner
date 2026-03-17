import { useState, useEffect } from 'react'
import './App.css'

const suggestions = [
  { category: 'Meat Dish', name: 'Braised Short Ribs', description: 'Tender beef short ribs slow-braised in red wine and herbs.' },
  { category: 'Vegetable Dish', name: 'Roasted Cauliflower', description: 'Crispy roasted cauliflower with tahini drizzle and pomegranate.' },
  { category: 'Soup', name: 'Tomato Basil Soup', description: 'Classic creamy tomato soup with fresh basil and croutons.' },
  { category: 'Drink', name: 'Mango Lassi', description: 'Chilled yogurt smoothie blended with ripe mango and cardamom.' },
]

const initialDishes = [
  { id: 1, name: 'Pasta Carbonara', description: 'Creamy Italian pasta with pancetta, egg, and parmesan.', ingredients: ['spaghetti', 'pancetta', 'eggs', 'parmesan', 'black pepper'] },
  { id: 2, name: 'Chicken Stir Fry', description: 'Quick veggie and chicken stir fry with soy-ginger sauce.', ingredients: ['chicken breast', 'bell pepper', 'broccoli', 'soy sauce', 'ginger', 'garlic'] },
  { id: 3, name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, basil, and tomato.', ingredients: ['pizza dough', 'mozzarella', 'tomato', 'basil', 'olive oil'] },
  { id: 4, name: 'Beef Tacos', description: 'Seasoned ground beef tacos with salsa, cheese, and cilantro.', ingredients: ['ground beef', 'taco shells', 'salsa', 'cheddar', 'cilantro', 'onion'] },
  { id: 5, name: 'Greek Salad', description: 'Cucumber, tomato, olives, and feta with lemon dressing.', ingredients: ['cucumber', 'tomato', 'olives', 'feta', 'lemon', 'olive oil'] },
  { id: 6, name: 'Salmon Teriyaki', description: 'Pan-seared salmon glazed with homemade teriyaki sauce.', ingredients: ['salmon fillet', 'soy sauce', 'mirin', 'sugar', 'ginger', 'garlic'] },
  { id: 7, name: 'Vegetable Curry', description: 'Hearty coconut curry loaded with seasonal vegetables.', ingredients: ['coconut milk', 'curry paste', 'potato', 'carrot', 'bell pepper', 'onion'] },
  { id: 8, name: 'Mushroom Risotto', description: 'Creamy arborio rice with mixed mushrooms and parmesan.', ingredients: ['arborio rice', 'mushrooms', 'parmesan', 'onion', 'garlic', 'white wine'] },
]

const navItems = [
  { key: 'home', label: 'Home', icon: 'bi-house-door' },
  { key: 'menu', label: 'My Menu', icon: 'bi-book' },
  { key: 'favorites', label: 'Favorites', icon: 'bi-heart' },
  { key: 'shopping', label: 'Shopping List', icon: 'bi-cart' },
  { key: 'family', label: 'My Family', icon: 'bi-people' },
  { key: 'settings', label: 'Settings', icon: 'bi-gear' },
]

const favoriteDishes = [
  { rank: 1, name: 'Pasta Carbonara', description: 'Creamy Italian pasta with pancetta, egg, and parmesan.' },
  { rank: 2, name: 'Salmon Teriyaki', description: 'Pan-seared salmon glazed with homemade teriyaki sauce.' },
  { rank: 3, name: 'Margherita Pizza', description: 'Classic pizza with fresh mozzarella, basil, and tomato.' },
  { rank: 4, name: 'Chicken Stir Fry', description: 'Quick veggie and chicken stir fry with soy-ginger sauce.' },
  { rank: 5, name: 'Mushroom Risotto', description: 'Creamy arborio rice with mixed mushrooms and parmesan.' },
  { rank: 6, name: 'Beef Tacos', description: 'Seasoned ground beef tacos with salsa, cheese, and cilantro.' },
  { rank: 7, name: 'Greek Salad', description: 'Cucumber, tomato, olives, and feta with lemon dressing.' },
  { rank: 8, name: 'Vegetable Curry', description: 'Hearty coconut curry loaded with seasonal vegetables.' },
  { rank: 9, name: 'Braised Short Ribs', description: 'Tender beef short ribs slow-braised in red wine and herbs.' },
  { rank: 10, name: 'Tomato Basil Soup', description: 'Classic creamy tomato soup with fresh basil and croutons.' },
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
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const [adding, setAdding] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const applyDark = (dark) => root.classList.toggle('dark', dark)
    localStorage.setItem('theme', theme)

    if (theme === 'dark') {
      applyDark(true)
    } else if (theme === 'light') {
      applyDark(false)
    } else {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyDark(mq.matches)
      const handler = (e) => applyDark(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

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
        {adding ? (
          <>
            <div className="add-dish-page">
              <button className="add-dish-return" onClick={() => setShowConfirm(true)}>
                <i className="bi-arrow-left" /> Return
              </button>
            </div>
            {showConfirm && (
              <div className="modal-overlay">
                <div className="modal-box">
                  <p>Are you sure you want to leave? Your changes will be lost.</p>
                  <div className="modal-actions">
                    <button className="modal-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
                    <button className="modal-confirm" onClick={() => { setShowConfirm(false); setAdding(false) }}>Leave</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : <>
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
        {page === 'favorites' && (
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
              <div className="family-card family-add-card" onClick={() => {}}>
                <div className="family-avatar family-add-avatar"><i className="bi-plus-lg" /></div>
                <span className="family-name">Add Member</span>
              </div>
            </div>
          </>
        )}
        {page === 'settings' && (
          <>
            <h1>Settings</h1>
            <section className="settings-section">
              <h2>Appearance</h2>
              <div className="theme-toggle">
                {['system', 'light', 'dark'].map((opt) => (
                  <button
                    key={opt}
                    className={theme === opt ? 'active' : ''}
                    onClick={() => setTheme(opt)}
                  >
                    <i className={opt === 'system' ? 'bi-display' : opt === 'light' ? 'bi-sun' : 'bi-moon'} />
                    {' '}{opt[0].toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        {page === 'shopping' && (() => {
          const allIngredients = [...new Set(dishes.flatMap((d) => d.ingredients))].sort()
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
                  {dishes.map((dish) => (
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
        })()}
        {page !== 'home' && page !== 'menu' && page !== 'favorites' && page !== 'family' && page !== 'settings' && page !== 'shopping' && (
          <h1>{navItems.find((item) => item.key === page)?.label}</h1>
        )}
        <button className="fab" onClick={() => setAdding(true)}><i className="bi-plus-lg" /> Add new dish</button>
        </>}
      </main>
    </>
  )
}

export default App
