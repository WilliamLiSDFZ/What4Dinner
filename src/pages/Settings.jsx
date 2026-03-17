import { useContext } from 'react'
import { ThemeContext } from '../ThemeContext'

export default function Settings() {
  const { theme, setTheme } = useContext(ThemeContext)

  return (
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
  )
}
