import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.css'
import { ThemeContext } from './ThemeContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Favorites from './pages/Favorites'
import Shopping from './pages/Shopping'
import Family from './pages/Family'
import Settings from './pages/Settings'
import AddDish from './pages/AddDish'

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
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="menu" element={<Menu />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="shopping" element={<Shopping />} />
          <Route path="family" element={<Family />} />
          <Route path="settings" element={<Settings />} />
          <Route path="add" element={<AddDish />} />
        </Route>
      </Routes>
    </ThemeContext.Provider>
  )
}
