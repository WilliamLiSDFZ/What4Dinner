import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import App from './App'
import Layout from './components/Layout'
import Home from './pages/Home'
import Menu from './pages/Menu'
import Favorites from './pages/Favorites'
import Shopping from './pages/Shopping'
import Family from './pages/Family'
import Settings from './pages/Settings'
import AddDish from './pages/AddDish'
import Callback from './pages/Callback'

// A data router rather than <BrowserRouter>: useBlocker — the unsaved-changes
// guard on /add — only works under one. Both layout routes are pathless, so the
// index route still resolves at "/".
export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route path="callback" element={<Callback />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="shopping" element={<Shopping />} />
        <Route path="family" element={<Family />} />
        <Route path="settings" element={<Settings />} />
        <Route path="add" element={<AddDish />} />
      </Route>
    </Route>,
  ),
)
