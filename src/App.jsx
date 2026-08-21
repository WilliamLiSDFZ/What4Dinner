import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import './App.css'
import { ThemeContext } from './ThemeContext'

// Root layout route: owns the theme and renders whichever child route matched.
// The route tree itself lives in src/router.jsx.
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')

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
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <Outlet />
    </ThemeContext.Provider>
  )
}
